import type { TrialCondition, TrialDefinition } from './types'

export type FairnessIssueCode =
  | 'condition-set'
  | 'missing-task'
  | 'missing-consequence'
  | 'missing-behavior-under-test'
  | 'target-size-minimum'
  | 'target-size-parity'
  | 'shared-copy-parity'
  | 'color-only-communication'
  | 'intentional-degradation'

export type FairnessIssue = {
  code: FairnessIssueCode
  message: string
  condition?: TrialCondition
}

function arraysEqual(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

export function validateTrialFairness(definition: TrialDefinition): FairnessIssue[] {
  const issues: FairnessIssue[] = []
  const conditionSet = new Set(definition.conditions)
  const conventional = definition.conditionDesign.conventional
  const adaptive = definition.conditionDesign.adaptive

  if (conditionSet.size !== 2 || !conditionSet.has('conventional') || !conditionSet.has('adaptive')) {
    issues.push({ code: 'condition-set', message: 'A comparison must include conventional and adaptive exactly once.' })
  }
  if (!definition.taskPrompt.trim()) {
    issues.push({ code: 'missing-task', message: 'The shared task prompt cannot be empty.' })
  }
  if (!definition.comparisonFacts.consequence.trim()) {
    issues.push({ code: 'missing-consequence', message: 'Shared consequence facts cannot be empty.' })
  }
  if (!definition.behaviorUnderTest.trim()) {
    issues.push({ code: 'missing-behavior-under-test', message: 'The behavior under test must be named explicitly.' })
  }

  for (const design of [conventional, adaptive]) {
    if (design.targetMinCssPx < 44) {
      issues.push({
        code: 'target-size-minimum',
        condition: design.condition,
        message: `${design.condition} target minimum must be at least 44 CSS pixels.`,
      })
    }
    if (!design.communicatesWithoutColor) {
      issues.push({
        code: 'color-only-communication',
        condition: design.condition,
        message: `${design.condition} must communicate state without relying on color alone.`,
      })
    }
    if (design.intentionallyDegraded) {
      issues.push({
        code: 'intentional-degradation',
        condition: design.condition,
        message: `${design.condition} cannot be intentionally degraded to influence the comparison.`,
      })
    }
  }

  if (conventional.targetMinCssPx !== adaptive.targetMinCssPx) {
    issues.push({ code: 'target-size-parity', message: 'Primary target minimums must match across conditions.' })
  }
  if (!arraysEqual(conventional.sharedCopy, adaptive.sharedCopy)) {
    issues.push({ code: 'shared-copy-parity', message: 'Shared explanatory copy must be identical across conditions.' })
  }

  return issues
}

export function assertTrialFairness(definition: TrialDefinition): TrialDefinition {
  const issues = validateTrialFairness(definition)
  if (issues.length > 0) {
    throw new Error(issues.map(issue => `[${issue.code}] ${issue.message}`).join('\n'))
  }
  return definition
}
