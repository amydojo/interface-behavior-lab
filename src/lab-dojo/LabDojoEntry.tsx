import { ActionControl, SpecimenTag, StateReadout } from './primitives'

type Props = {
  onEnterLaboratory: () => void
  onOpenCatalog: () => void
}

export function LabDojoEntry({ onEnterLaboratory, onOpenCatalog }: Props) {
  return (
    <section className="ld-entry" aria-labelledby="lab-dojo-title">
      <h2 className="sr-only">Adaptive Controls</h2>
      <div className="ld-entry-copy">
        <span className="ld-kicker">INTERACTION SYSTEM / 01</span>
        <h1 id="lab-dojo-title">
          <span>THE BUTTON IS</span>
          <span>NO LONGER</span>
          <span>A SHAPE.</span>
        </h1>
        <p>
          A coded laboratory for controls that communicate intention, consequence, commitment,
          system state, and recovery.
        </p>
        <ActionControl
          label="RUN THE TWO-MINUTE TRIAL"
          meta="SIX BEATS / NO PERSONAL DATA"
          state="active"
          onClick={onEnterLaboratory}
        />
        <button type="button" className="ld-text-action" onClick={onOpenCatalog}>
          OR BROWSE ALL SIX SPECIMENS <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="ld-living-specimen" aria-label="Intent specimen preview">
        <SpecimenTag label="SPECIMEN 01 / INTENT" surface="ink" />
        <div className="ld-intent-field" aria-hidden="true"><i /><i /></div>
        <ActionControl
          label="SAVE TO JOURNAL"
          meta="2 CHANGES"
          tone="intent"
          state="active"
        />
        <StateReadout value="REVEALED" label="CURRENT STATE" signal="intent" surface="ink" />
      </div>

      <p className="ld-entry-rule">ONE THING PERFORMS. ONE THING EXPLAINS. EVERYTHING ELSE WAITS.</p>
    </section>
  )
}
