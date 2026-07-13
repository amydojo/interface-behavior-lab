export type LabMode = 'light' | 'dark' | 'spatial'
export type InputModality = 'pointer' | 'touch' | 'voice' | 'switch'
export type Family = 'Intent' | 'Pressure' | 'Breathing' | 'Magnetic' | 'Ethical' | 'Reversible' | 'System'

export type LabEvent = {
  id: number
  at: string
  family: Family
  action: string
  detail?: string
  modality: InputModality
}

export type DemoProps = {
  reducedMotion: boolean
  modality: InputModality
  assistance: number
  onEvent: (family: Family, action: string, detail?: string) => void
}
