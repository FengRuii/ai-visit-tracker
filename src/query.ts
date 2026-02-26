// src/query.ts
import { BaseAdapter, Stats, QueryOptions } from './adapters/base'

let adapter: BaseAdapter | null = null

export function setAdapter(a: BaseAdapter): void {
  adapter = a
}

export async function getStats(options?: QueryOptions): Promise<Stats> {
  if (!adapter) {
    throw new Error('ai-visit-tracker: no adapter configured. Call aiVisitTracker() before getStats().')
  }
  return adapter.query(options)
}
