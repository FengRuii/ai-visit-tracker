import agents from '../agents.json'

const agentMap: Array<{ name: string; patterns: string[] }> = Object.entries(agents).map(
  ([name, patterns]) => ({ name, patterns: (patterns as string[]).map(p => p.toLowerCase()) })
)

export function detectAgent(userAgent: string | undefined): string | null {
  if (!userAgent) return null
  const ua = userAgent.toLowerCase()
  for (const { name, patterns } of agentMap) {
    for (const pattern of patterns) {
      if (ua.includes(pattern)) return name
    }
  }
  return null
}
