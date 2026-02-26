# ai-visit-tracker

Express middleware that tracks visits from AI agents and bots.

## Install

```bash
npm install ai-visit-tracker
```

## Usage

```js
import express from 'express'
import { aiVisitTracker } from 'ai-visit-tracker'

const app = express()
app.use(aiVisitTracker())
```

Visit `GET /ai-visits` to see stats:

```json
{
  "total": 4821,
  "agents": { "GPTBot": 2100, "ClaudeBot": 1200 },
  "timeSeries": {
    "daily":   [{ "date": "2026-02-26", "count": 142 }],
    "weekly":  [{ "week": "2026-W08",   "count": 891 }],
    "monthly": [{ "month": "2026-02",   "count": 3201 }]
  }
}
```

## Options

```js
app.use(aiVisitTracker({
  endpoint: '/custom-path',          // default: /ai-visits
  adapter: new PostgresAdapter(url), // default: SQLite (ai-visits.db)
  exclude: ['/health', '/static'],   // paths to skip (router-relative)
}))
```

### `endpoint`

The HTTP path where stats are served. Defaults to `/ai-visits`. If you mount the middleware at a prefix (e.g. `app.use('/api', aiVisitTracker())`), the stats endpoint becomes `/api/ai-visits`.

### `adapter`

A storage backend that extends `BaseAdapter`. Defaults to SQLite, which creates `ai-visits.db` in the process's working directory automatically.

### `exclude`

An array of path strings to skip tracking. Paths are matched against `req.path`, which is router-relative. For example, if mounted at `/api`, use `exclude: ['/health']` to skip `/api/health`.

## Programmatic Access

```js
import { getStats } from 'ai-visit-tracker'

// Call aiVisitTracker() first to initialise the adapter, then:
const stats = await getStats()
```

`getStats()` returns the same `Stats` object served by the HTTP endpoint.

## Custom Adapter

Implement `BaseAdapter` to use any storage backend:

```ts
import { BaseAdapter, Stats, QueryOptions } from 'ai-visit-tracker'

class MyAdapter extends BaseAdapter {
  async migrate(): Promise<void> {
    // Create tables / run schema migrations
  }

  async record(agent: string, path: string, timestamp: number): Promise<void> {
    // Insert a visit row. timestamp is a Unix epoch integer (seconds).
  }

  async query(options?: QueryOptions): Promise<Stats> {
    // Return aggregated stats. options.from / options.to are optional
    // Unix timestamps for filtering by date range.
  }
}

app.use(aiVisitTracker({ adapter: new MyAdapter() }))
```

## Detected Agents

Agent detection is driven by the bundled `agents.json` file. Each key is the canonical display name shown in stats; values are substrings matched case-insensitively against the `User-Agent` header.

Community contributions to `agents.json` are very welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Requirements

- Node.js >= 18
- Express >= 4.0.0

## License

MIT
