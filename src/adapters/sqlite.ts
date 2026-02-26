// src/adapters/sqlite.ts
import Database from 'better-sqlite3'
import { BaseAdapter, Stats, QueryOptions } from './base'

export class SQLiteAdapter extends BaseAdapter {
  private db: Database.Database

  constructor(private dbPath = 'ai-visits.db') {
    super()
    this.db = new Database(dbPath)
  }

  async migrate(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS visits (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        agent     TEXT NOT NULL,
        path      TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_agent     ON visits(agent);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON visits(timestamp);
    `)
  }

  async record(agent: string, path: string, timestamp: number): Promise<void> {
    this.db
      .prepare('INSERT INTO visits (agent, path, timestamp) VALUES (?, ?, ?)')
      .run(agent, path, timestamp)
  }

  async query(options: QueryOptions = {}): Promise<Stats> {
    const clauses: string[] = []
    const params: number[] = []
    if (options.from != null) { clauses.push('timestamp >= ?'); params.push(options.from) }
    if (options.to   != null) { clauses.push('timestamp <= ?'); params.push(options.to) }
    const where = clauses.length ? ' AND ' + clauses.join(' AND ') : ''

    // Helper: run a prepared statement with optional params, supporting zero or more bind values.
    // better-sqlite3 requires spread syntax for bind params; we use a conditional spread
    // to avoid TypeScript errors when params is empty.
    const execGet = <T>(sql: string): T => {
      const stmt = this.db.prepare(sql)
      return (params.length > 0 ? stmt.get(...params as [number]) : stmt.get()) as T
    }
    const execAll = <T>(sql: string): T[] => {
      const stmt = this.db.prepare(sql)
      return (params.length > 0 ? stmt.all(...params as [number]) : stmt.all()) as T[]
    }

    const { count: total } = execGet<{ count: number }>(
      `SELECT COUNT(*) as count FROM visits WHERE 1=1${where}`
    )

    const agentRows = execAll<{ agent: string; count: number }>(
      `SELECT agent, COUNT(*) as count FROM visits WHERE 1=1${where} GROUP BY agent`
    )

    const agents: Record<string, number> = {}
    for (const row of agentRows) agents[row.agent] = row.count

    const daily = execAll<{ date: string; count: number }>(`
      SELECT strftime('%Y-%m-%d', datetime(timestamp, 'unixepoch')) as date,
             COUNT(*) as count
      FROM visits WHERE 1=1${where}
      GROUP BY date ORDER BY date
    `)

    const weekly = execAll<{ week: string; count: number }>(`
      SELECT strftime('%Y-W%W', datetime(timestamp, 'unixepoch')) as week,
             COUNT(*) as count
      FROM visits WHERE 1=1${where}
      GROUP BY week ORDER BY week
    `)

    const monthly = execAll<{ month: string; count: number }>(`
      SELECT strftime('%Y-%m', datetime(timestamp, 'unixepoch')) as month,
             COUNT(*) as count
      FROM visits WHERE 1=1${where}
      GROUP BY month ORDER BY month
    `)

    return { total, agents, timeSeries: { daily, weekly, monthly } }
  }
}
