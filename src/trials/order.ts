import type { ConditionOrderMode, TrialCondition } from './types'

const conventionalFirst = ['conventional', 'adaptive'] as const satisfies readonly TrialCondition[]
const adaptiveFirst = ['adaptive', 'conventional'] as const satisfies readonly TrialCondition[]

export function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function resolveConditionOrder(
  mode: ConditionOrderMode,
  seed?: string,
): readonly [TrialCondition, TrialCondition] {
  if (mode === 'conventional-first') return conventionalFirst
  if (mode === 'adaptive-first') return adaptiveFirst
  if (!seed?.trim()) throw new Error('Randomized condition order requires a stable non-empty seed.')
  return hashSeed(seed) % 2 === 0 ? conventionalFirst : adaptiveFirst
}
