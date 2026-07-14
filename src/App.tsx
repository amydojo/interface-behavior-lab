import { useCallback, useEffect, useMemo, useState } from 'react'
import './styles.css'
import type { Family, InputModality, LabEvent, LabMode } from './types'
import { LabControls } from './components/LabControls'
import { EventLog } from './components/EventLog'
import { IntentDemo } from './components/IntentDemo'
import { PressureDemo } from './components/PressureDemo'
import { BreathingDemo } from './components/BreathingDemo'
import { MagneticDemo } from './components/MagneticDemo'
import { EthicalDemo } from './components/EthicalDemo'
import { ReversibleDemo } from './components/ReversibleDemo'
import { SpecimenBoundary } from './components/SpecimenBoundary'

function timeLabel() {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date())
}

export default function App() {
  const [mode, setMode] = useState<LabMode>('spatial')
  const [modality, setModality] = useState<InputModality>('pointer')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [lowEffects, setLowEffects] = useState(false)
  const [assistance, setAssistance] = useState(62)
  const [events, setEvents] = useState<LabEvent[]>([])
  const [session, setSession] = useState(1)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const transparency = window.matchMedia('(prefers-reduced-transparency: reduce)')
    setReducedMotion(motion.matches)
    setLowEffects(transparency.matches)
  }, [])

  const onEvent = useCallback((family: Family, action: string, detail?: string) => {
    setEvents(current => [{
      id: Date.now() + Math.random(),
      at: timeLabel(),
      family,
      action,
      detail,
      modality,
    }, ...current].slice(0, 32))
  }, [modality])

  const demoProps = useMemo(() => ({ reducedMotion, modality, assistance, onEvent }), [reducedMotion, modality, assistance, onEvent])

  const reset = () => {
    setSession(value => value + 1)
    setEvents([])
    onEvent('System', 'laboratory reset', 'All component state returned to default')
  }

  return (
    <div
      className="app-shell"
      data-mode={mode}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-low-effects={lowEffects ? 'true' : 'false'}
    >
      <div className="ambient-field" aria-hidden="true"><i /><i /></div>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Interface Behavior Lab home">
          <span>IBL</span>
          <strong>Interface Behavior Lab</strong>
        </a>
        <nav aria-label="Project links">
          <a href="https://www.figma.com/design/4jIfeqwhalMPugSAuVtvSi" target="_blank" rel="noreferrer">Figma</a>
          <a href="https://github.com/amydojo/interface-behavior-lab" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">UNDONE FUTURES · INTERACTION SYSTEM 01</span>
            <h1>Adaptive<br />Controls</h1>
            <p>A coded interaction laboratory for controls that understand intention, pressure, attention, consequence, and recovery.</p>
            <div className="hero-actions">
              <a href="#laboratory">Enter laboratory</a>
              <span>V1.1 · 6 live behaviors</span>
            </div>
          </div>
          <div className="hero-object" aria-hidden="true">
            <i /><i /><i /><i />
            <div className="hero-button">
              <span><strong>Continue with intent</strong><small>PRESSURE · 0.66</small></span>
              <b>→</b>
            </div>
            <em className="approach">APPROACH</em>
            <em className="commit">COMMIT</em>
          </div>
        </section>

        <section className="manifesto-strip" aria-label="System manifesto">
          <span>THE BUTTON IS NO LONGER A SHAPE.</span>
          <strong>It is a negotiation between your intention, the system’s intelligence, and what happens next.</strong>
        </section>

        <LabControls
          mode={mode}
          onModeChange={next => {
            setMode(next)
            onEvent('System', 'mode changed', next)
          }}
          modality={modality}
          onModalityChange={next => {
            setModality(next)
            onEvent('System', 'input modality changed', next)
          }}
          reducedMotion={reducedMotion}
          onReducedMotionChange={next => {
            setReducedMotion(next)
            onEvent('System', 'reduce motion changed', next ? 'enabled' : 'disabled')
          }}
          assistance={assistance}
          onAssistanceChange={next => setAssistance(next)}
          onReset={reset}
        />

        <section id="laboratory" className="laboratory" aria-labelledby="lab-title">
          <header className="section-heading">
            <span>LIVE COMPONENTS</span>
            <h2 id="lab-title">Six behaviors. One action language.</h2>
            <p>Each specimen uses a native button, a stable target, named states, and a non-novel path when the enhanced input is unavailable.</p>
          </header>
          <div className="demo-grid" key={session}>
            <SpecimenBoundary name="Intent"><IntentDemo {...demoProps} /></SpecimenBoundary>
            <SpecimenBoundary name="Pressure"><PressureDemo {...demoProps} /></SpecimenBoundary>
            <SpecimenBoundary name="Breathing"><BreathingDemo {...demoProps} /></SpecimenBoundary>
            <SpecimenBoundary name="Magnetic"><MagneticDemo {...demoProps} /></SpecimenBoundary>
            <SpecimenBoundary name="Ethical"><EthicalDemo {...demoProps} /></SpecimenBoundary>
            <SpecimenBoundary name="Reversible"><ReversibleDemo {...demoProps} /></SpecimenBoundary>
          </div>
        </section>

        <section className="lower-grid">
          <div className="lifecycle-panel">
            <span>ACTION LIFECYCLE</span>
            <h2>One action can move through several behaviors without becoming several interfaces.</h2>
            <div className="lifecycle-steps">
              {[
                ['01', 'APPROACH', 'Magnetic', 'assist'],
                ['02', 'CLARIFY', 'Intent', 'name'],
                ['03', 'WEIGH', 'Ethical', 'inform'],
                ['04', 'COMMIT', 'Pressure', 'act'],
                ['05', 'RESOLVE', 'Breathing', 'confirm'],
                ['06', 'RECOVER', 'Reversible', 'undo'],
              ].map(([number, stage, family, verb]) => (
                <article key={number}>
                  <small>{number}</small><span>{stage}</span><strong>{family}</strong><em>{verb}</em>
                </article>
              ))}
            </div>
          </div>
          <EventLog events={events} />
        </section>

        <section className="system-note">
          <span>SYSTEM NOTE</span>
          <strong>Adaptive behavior should appear only when it reduces ambiguity, accidental activation, motor effort, or recovery cost.</strong>
          <p>The conventional control remains the comparison condition. The future is selective, not noisy.</p>
        </section>
      </main>

      <footer className="site-footer">
        <span>Independent speculative research by Amy Do / UNDONE by design.</span>
        <span>Not affiliated with Apple.</span>
      </footer>
    </div>
  )
}
