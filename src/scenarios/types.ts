export type ScenarioId =
  | 'journal-save'
  | 'destructive-delete'
  | 'assistant-request'
  | 'message-send'
  | 'public-publish'
  | 'archive-recovery'

export type ScenarioDefinition = {
  id: ScenarioId
  title: string
  summary: string
  consequence: string
  successResult: string
  recoveryResult?: string
}
