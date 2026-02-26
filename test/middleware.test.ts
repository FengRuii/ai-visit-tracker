import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { aiVisitTracker } from '../src/middleware'
import { SQLiteAdapter } from '../src/adapters/sqlite'

// Helper: creates an Express app with the middleware and a /hello route.
// Migration is handled by the middleware factory itself (SQLite sync migration).
function makeApp(opts: Parameters<typeof aiVisitTracker>[0] = {}) {
  const adapter = new SQLiteAdapter(':memory:')
  const app = express()
  app.use(aiVisitTracker({ ...opts, adapter }))
  app.get('/hello', (_req, res) => res.json({ ok: true }))
  return { app, adapter }
}

describe('aiVisitTracker middleware', () => {
  it('passes non-AI requests through', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/hello').set('User-Agent', 'Mozilla/5.0')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('exposes GET /ai-visits endpoint', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/ai-visits')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      total: 0,
      agents: {},
      timeSeries: expect.any(Object),
    })
  })

  it('records AI agent visits', async () => {
    const { app, adapter } = makeApp()
    await request(app).get('/hello').set('User-Agent', 'GPTBot/1.0')
    // Give the fire-and-forget record() a tick to complete
    await Promise.resolve()
    const stats = await adapter.query()
    expect(stats.total).toBe(1)
    expect(stats.agents['GPTBot']).toBe(1)
  })

  it('does not record non-AI visits', async () => {
    const { app, adapter } = makeApp()
    await request(app).get('/hello').set('User-Agent', 'Mozilla/5.0 Chrome/120')
    const stats = await adapter.query()
    expect(stats.total).toBe(0)
  })

  it('respects the exclude list', async () => {
    const { app, adapter } = makeApp({ exclude: ['/hello'] })
    await request(app).get('/hello').set('User-Agent', 'GPTBot/1.0')
    await Promise.resolve()
    const stats = await adapter.query()
    expect(stats.total).toBe(0)
  })

  it('respects custom endpoint path', async () => {
    const { app } = makeApp({ endpoint: '/custom-stats' })
    const res = await request(app).get('/custom-stats')
    expect(res.status).toBe(200)
  })

  it('returns 404 for default path when custom endpoint is set', async () => {
    const { app } = makeApp({ endpoint: '/custom-stats' })
    const res = await request(app).get('/ai-visits')
    expect(res.status).toBe(404)
  })

  it('getStats() returns data from the same adapter', async () => {
    const { adapter } = makeApp()
    await adapter.record('GPTBot', '/', Math.floor(Date.now() / 1000))
    await Promise.resolve()
    const { getStats } = await import('../src/query')
    const stats = await getStats()
    expect(stats.total).toBe(1)
  })
})
