// test/query.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setAdapter, getStats } from '../src/query'
import { SQLiteAdapter } from '../src/adapters/sqlite'

describe('getStats', () => {
  let adapter: SQLiteAdapter

  beforeEach(async () => {
    adapter = new SQLiteAdapter(':memory:')
    await adapter.migrate()
    setAdapter(adapter)
  })

  it('delegates to the configured adapter', async () => {
    await adapter.record('GPTBot', '/', 1772064000)
    const stats = await getStats()
    expect(stats.total).toBe(1)
    expect(stats.agents['GPTBot']).toBe(1)
  })

  it('passes QueryOptions to the adapter', async () => {
    await adapter.record('GPTBot', '/', 1000)
    await adapter.record('GPTBot', '/', 2000)
    const stats = await getStats({ from: 1500 })
    expect(stats.total).toBe(1)
  })
})
