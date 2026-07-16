export type LabDojoSignal = 'neutral' | 'intent' | 'exploratory' | 'consequence' | 'commit' | 'recover'

export function signalForExperiment(experimentId: string): LabDojoSignal {
  if (experimentId === 'intent' || experimentId === 'magnetic') return 'intent'
  if (experimentId === 'pressure') return 'consequence'
  if (experimentId === 'ethical') return 'commit'
  if (experimentId === 'reversible') return 'recover'
  if (experimentId === 'breathing') return 'exploratory'
  return 'neutral'
}
