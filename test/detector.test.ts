import { describe, it, expect } from 'vitest'
import { detectAgent } from '../src/detector'

describe('detectAgent', () => {
  it('returns null for a browser user agent', () => {
    expect(detectAgent('Mozilla/5.0 Chrome/120.0')).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(detectAgent(undefined)).toBeNull()
  })

  it('detects GPTBot', () => {
    expect(detectAgent('GPTBot/1.0')).toBe('GPTBot')
  })

  it('detects ClaudeBot', () => {
    expect(detectAgent('ClaudeBot/1.0')).toBe('ClaudeBot')
  })

  it('is case-insensitive', () => {
    expect(detectAgent('gptbot/1.0')).toBe('GPTBot')
  })

  it('detects partial match anywhere in the UA string', () => {
    expect(detectAgent('Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)')).toBe('GPTBot')
  })
})
