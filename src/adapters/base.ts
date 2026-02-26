// src/adapters/base.ts

export interface Stats {
  total: number
  agents: Record<string, number>
  timeSeries: {
    daily:   Array<{ date: string;  count: number }>  // "YYYY-MM-DD"
    weekly:  Array<{ week: string;  count: number }>  // "YYYY-WNN"
    monthly: Array<{ month: string; count: number }>  // "YYYY-MM"
  }
}

export interface QueryOptions {
  from?: number  // Unix timestamp (inclusive)
  to?: number    // Unix timestamp (inclusive)
}

export abstract class BaseAdapter {
  abstract record(agent: string, path: string, timestamp: number): Promise<void>
  abstract query(options?: QueryOptions): Promise<Stats>
  abstract migrate(): Promise<void>
}
