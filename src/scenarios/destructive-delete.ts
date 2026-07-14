import type { ScenarioDefinition } from './types'

export const destructiveDeleteScenario = {
  id: 'destructive-delete',
  title: 'Delete affected items',
  summary: 'Separate preview, reversible trash, and irreversible deletion.',
  consequence: 'Permanent deletion cannot be undone.',
  successResult: 'Deleted permanently',
  recoveryResult: 'Moved to Trash · Undo available',
  previewResult: 'Previewed 4 affected items',
} as const satisfies ScenarioDefinition & Record<string, string>
