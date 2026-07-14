import { describe, expect, it } from 'vitest'
import { hashSeed, resolveConditionOrder } from './order'

describe('condition ordering', () => {
  it('returns explicit orders without requiring a seed', () => {
    expect(resolveConditionOrder('conventional-first')).toEqual(['conventional', 'adaptive'])
    expect(resolveConditionOrder('adaptive-first')).toEqual(['adaptive', 'conventional'])
  })

  it('keeps randomized order stable for a reproducible seed', () => {
    const first = resolveConditionOrder('randomized', 'session-42:intent')
    const restored = resolveConditionOrder('randomized', 'session-42:intent')

    expect(restored).toEqual(first)
    expect(new Set(first)).toEqual(new Set(['conventional', 'adaptive']))
    expect(hashSeed('session-42:intent')).toBe(hashSeed('session-42:intent'))
  })

  it('refuses randomized order without a stable seed', () => {
    expect(() => resolveConditionOrder('randomized')).toThrow(/stable non-empty seed/i)
    expect(() => resolveConditionOrder('randomized', '   ')).toThrow(/stable non-empty seed/i)
  })
})
