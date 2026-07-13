import type { InputModality, LabMode } from '../types'

type Props = {
  mode: LabMode
  onModeChange: (mode: LabMode) => void
  modality: InputModality
  onModalityChange: (modality: InputModality) => void
  reducedMotion: boolean
  onReducedMotionChange: (value: boolean) => void
  assistance: number
  onAssistanceChange: (value: number) => void
  onReset: () => void
}

export function LabControls({
  mode,
  onModeChange,
  modality,
  onModalityChange,
  reducedMotion,
  onReducedMotionChange,
  assistance,
  onAssistanceChange,
  onReset,
}: Props) {
  return (
    <section className="lab-controls" aria-labelledby="lab-controls-title">
      <div className="control-heading">
        <span>LAB CONTROLS</span>
        <h2 id="lab-controls-title">Change the environment, not the rules.</h2>
      </div>

      <fieldset>
        <legend>Material mode</legend>
        <div className="segmented-control">
          {(['light', 'dark', 'spatial'] as LabMode[]).map(item => (
            <button type="button" key={item} aria-pressed={mode === item} onClick={() => onModeChange(item)}>
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Input modality</legend>
        <div className="segmented-control compact">
          {(['pointer', 'touch', 'voice', 'switch'] as InputModality[]).map(item => (
            <button type="button" key={item} aria-pressed={modality === item} onClick={() => onModalityChange(item)}>
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="toggle-control">
        <span>
          <strong>Reduce Motion</strong>
          <small>Replace deformation with static state cues</small>
        </span>
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={event => onReducedMotionChange(event.target.checked)}
        />
        <i aria-hidden="true" />
      </label>

      <label className="range-control">
        <span>
          <strong>Assistance</strong>
          <output>{assistance}%</output>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={assistance}
          onChange={event => onAssistanceChange(Number(event.target.value))}
        />
      </label>

      <button className="reset-button" type="button" onClick={onReset}>Reset laboratory</button>
    </section>
  )
}
