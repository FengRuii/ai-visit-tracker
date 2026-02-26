// src/middleware.ts
import { Router } from 'express'
import { detectAgent } from './detector'
import { SQLiteAdapter } from './adapters/sqlite'
import { BaseAdapter } from './adapters/base'
import { setAdapter } from './query'

export interface MiddlewareOptions {
  endpoint?: string
  adapter?: BaseAdapter
  exclude?: string[]
}

export function aiVisitTracker(options: MiddlewareOptions = {}) {
  const {
    endpoint = '/ai-visits',
    exclude = [],
  } = options

  const adapter = options.adapter ?? new SQLiteAdapter()
  setAdapter(adapter)
  // SQLiteAdapter.migrate() is synchronous internally; fire-and-forget is safe.
  adapter.migrate().catch(err => console.error('[ai-visit-tracker] migration failed:', err))

  const router = Router()

  router.get(endpoint, (_req, res) => {
    adapter.query().then(stats => {
      res.json(stats)
    }).catch(err => {
      console.error('[ai-visit-tracker] query failed:', err)
      res.status(500).json({ error: 'Internal server error' })
    })
  })

  router.use((req, _res, next) => {
    if (!exclude.includes(req.path)) {
      const agent = detectAgent(req.headers['user-agent'] as string | undefined)
      if (agent) {
        adapter
          .record(agent, req.path, Math.floor(Date.now() / 1000))
          .catch(() => { /* swallow record errors; never affect the response */ })
      }
    }
    next()
  })

  return router
}
