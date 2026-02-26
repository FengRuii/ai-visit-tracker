// test/sqlite.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SQLiteAdapter } from '../src/adapters/sqlite'

describe('SQLiteAdapter', () => {
  let adapter: SQLiteAdapter

  beforeEach(async () => {
    adapter = new SQLiteAdapter(':memory:')
    await adapter.migrate()
  })

  it('starts with zero total', async () => {
    const stats = await adapter.query()
    expect(stats.total).toBe(0)
    expect(stats.agents).toEqual({})
    expect(stats.timeSeries.daily).toEqual([])
  })

  it('records and counts a single visit', async () => {
    await adapter.record('GPTBot', '/home', 1772064000)
    const stats = await adapter.query()
    expect(stats.total).toBe(1)
    expect(stats.agents['GPTBot']).toBe(1)
  })

  it('aggregates multiple visits per agent', async () => {
    await adapter.record('GPTBot', '/a', 1772064000)
    await adapter.record('GPTBot', '/b', 1772064001)
    await adapter.record('ClaudeBot', '/a', 1772064002)
    const stats = await adapter.query()
    expect(stats.total).toBe(3)
    expect(stats.agents['GPTBot']).toBe(2)
    expect(stats.agents['ClaudeBot']).toBe(1)
  })

  it('groups daily time series correctly', async () => {
    // 1772064000 = 2026-02-26 00:00:00 UTC
    await adapter.record('GPTBot', '/home', 1772064000)
    const stats = await adapter.query()
    expect(stats.timeSeries.daily).toHaveLength(1)
    expect(stats.timeSeries.daily[0].date).toBe('2026-02-26')
    expect(stats.timeSeries.daily[0].count).toBe(1)
  })

  it('groups weekly time series', async () => {
    await adapter.record('GPTBot', '/home', 1772064000)
    const stats = await adapter.query()
    expect(stats.timeSeries.weekly).toHaveLength(1)
    expect(stats.timeSeries.weekly[0].week).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('groups monthly time series', async () => {
    await adapter.record('GPTBot', '/home', 1772064000)
    const stats = await adapter.query()
    expect(stats.timeSeries.monthly).toHaveLength(1)
    expect(stats.timeSeries.monthly[0].month).toBe('2026-02')
  })
})
