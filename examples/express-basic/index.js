// examples/express-basic/index.js
// Run: node index.js
// Then visit: http://localhost:3000/ai-visits
const express = require('express')
const { aiVisitTracker, getStats } = require('ai-visit-tracker')

const app = express()
app.use(aiVisitTracker())

app.get('/', (_req, res) => res.send('Hello World'))

// Programmatic access example
app.get('/my-dashboard', async (_req, res) => {
  const stats = await getStats()
  res.json({ message: 'AI visits so far', stats })
})

app.listen(3000, () => console.log('Server on http://localhost:3000'))
