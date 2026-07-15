import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './styles.css'
import './hardening.css'
import type { Family, InputModality, LabEvent, LabMode } from './types'
import { LabControls } from './components/LabControls'
import { experimentById, experimentRegistry } from './experiments/registry'
import type { ExperimentId } from './experiments/types'
import { LabDojoEntry } from './lab-dojo/LabDojoEntry'
import { SpecimenTag } from './lab-dojo/primitives'
import { ActiveWorkspace } from './workspace/ActiveWorkspace'
import { CatalogView } from './workspace/CatalogView'
import {
  defaultExperimentId,
  parseWorkspaceHash,
  workspaceHash,
  type WorkspaceLocation,
} from './workspace/location'

function timeLabel() {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date())
}

function readInitialLocation(): WorkspaceLocation {
  if (typeof window === 'undefined') return { view: 'workspace', experimentId: defaultExperimentId }
  return parseWorkspaceHash(window.location.hash).location
}

export default function App() {
  const initialLocation = useMemo(readInitialLocation, [])
  const [mode, setMode] = useState<LabMode>('spatial')
  const [modality, setModality] = useState<InputModality>('pointer')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [lowEffects, setLowEffects] = useState(false)
  const [assistance, setAssistance] = useState(62)
  const [events, setEvents] = useState<LabEvent[]>([])
  const [location, setLocation] = useState<WorkspaceLocation>(initialLocation)
  const [activeState, setActiveState] = useState(() => experimentById[initialLocation.experimentId].initialState.id)
  const [completedIds, setCompletedIds] = useState<Set<ExperimentId>>(() => new Set())
  const [specimenEpoch, setSpecimenEpoch] = useState(0)
  const locationRef = useRef(location)
  const activeHeadingRef = useRef<HTMLHeadingElement>(null)

  locationRef.current = location
  const activeExperiment = experimentById[location.experimentId]

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const transparency = window.matchMedia('(prefers-reduced-transparency: reduce)')
    setReducedMotion(motion.matches)
    setLowEffects(transparency.matches)
  }, [])

  const onEvent = useCallback((family: Family, action: string, detail?: string) => {
    if (family !== 'System') {
      const experiment = experimentRegistry.find(item => item.family === family)
      if (experiment) {
        setCompletedIds(current => current.has(experiment.id) ? current : new Set([...current, experiment.id]))
      }
    }

    setEvents(current => [{
      id: Date.now() + Math.random(),
      at: timeLabel(),
      family,
      action,
      detail,
      modality,
    }, ...current].slice(0, 48))
  }, [modality])

  const applyLocation = useCallback((next: WorkspaceLocation, focusTarget = false) => {
    const current = locationRef.current
    if (current.view === next.view && current.experimentId === next.experimentId) return false

    locationRef.current = next
    setLocation(next)
    setActiveState(experimentById[next.experimentId].initialState.id)
    setSpecimenEpoch(value => value + 1)

    if (focusTarget) {
      window.requestAnimationFrame(() => {
        if (next.view === 'workspace') activeHeadingRef.current?.focus()
        else document.getElementById('catalog-title')?.focus()
      })
    }

    return true
  }, [])

  useEffect(() => {
    const parsed = parseWorkspaceHash(window.location.hash)
    if (!parsed.valid) window.history.replaceState(null, '', workspaceHash(parsed.location))

    const syncLocation = () => {
      const next = parseWorkspaceHash(window.location.hash)
      if (!next.valid) window.history.replaceState(null, '', workspaceHash(next.location))
      applyLocation(next.location)
    }

    window.addEventListener('popstate', syncLocation)
    window.addEventListener('hashchange', syncLocation)
    return () => {
      window.removeEventListener('popstate', syncLocation)
      window.removeEventListener('hashchange', syncLocation)
    }
  }, [applyLocation])

  const selectFamily = useCallback((experimentId: ExperimentId, source: 'keyboard' | 'pointer') => {
    const previous = locationRef.current
    const next: WorkspaceLocation = { view: 'workspace', experimentId }
    if (previous.view === next.view && previous.experimentId === next.experimentId) return

    window.history.pushState(null, '', workspaceHash(next))
    applyLocation(next, source === 'keyboard')
    onEvent('System', 'family selected', `${previous.experimentId} → ${experimentId}`)
    if (previous.view === 'catalog') onEvent('System', 'workspace opened', experimentById[experimentId].displayName)
  }, [applyLocation, onEvent])

  const openCatalog = useCallback((source: 'keyboard' | 'pointer') => {
    const current = locationRef.current
    if (current.view === 'catalog') return
    const next: WorkspaceLocation = { view: 'catalog', experimentId: current.experimentId }
    window.history.pushState(null, '', workspaceHash(next))
    applyLocation(next, source === 'keyboard')
    onEvent('System', 'catalog opened', current.experimentId)
  }, [applyLocation, onEvent])

  const resetLaboratory = useCallback(() => {
    setSpecimenEpoch(value => value + 1)
    setActiveState(activeExperiment.initialState.id)
    setCompletedIds(new Set())
    setEvents([{
      id: Date.now() + Math.random(),
      at: timeLabel(),
      family: 'System',
      action: 'laboratory reset',
      detail: 'Active trial, session events, and pending timers returned to default',
      modality,
    }])
  }, [activeExperiment.initialState.id, modality])

  const resetSpecimen = useCallback(() => {
    setSpecimenEpoch(value => value + 1)
    setActiveState(activeExperiment.initialState.id)
    onEvent(activeExperiment.family, 'specimen reset', `Returned to ${activeExperiment.initialState.id}`)
  }, [activeExperiment, onEvent])

  const demoProps = useMemo(() => ({
    reducedMotion,
    modality,
    assistance,
    onEvent,
    onStateChange: setActiveState,
  }), [reducedMotion, modality, assistance, onEvent])

  const enterLaboratory = () => {
    if (location.view === 'catalog') selectFamily(location.experimentId, 'pointer')
    window.requestAnimationFrame(() => {
      document.getElementById('laboratory')?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' })
    })
  }

  return (
    <div
      className="app-shell"
      data-mode={mode}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-low-effects={lowEffects ? 'true' : 'false'}
      data-workspace-view={location.view}
      data-design-version="lab-dojo-v1.3"
    >
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Lab Dojo home">
          <SpecimenTag label="LAB DOJO / INTERFACE BEHAVIOR LAB / V1.3" />
        </a>
        <nav aria-label="Project links">
          <a href="https://www.figma.com/design/4jIfeqwhalMPugSAuVtvSi?node-id=64-2" target="_blank" rel="noreferrer">Figma</a>
          <a href="https://github.com/amydojo/interface-behavior-lab" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </header>

      <main id="top">
        <LabDojoEntry onEnterLaboratory={enterLaboratory} onOpenCatalog={() => openCatalog('pointer')} />

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
          onReset={resetLaboratory}
        />

        {location.view === 'workspace' ? (
          <ActiveWorkspace
            key={`${activeExperiment.id}-${specimenEpoch}`}
            experiment={activeExperiment}
            currentState={activeState}
            completedIds={completedIds}
            events={events}
            modality={modality}
            mode={mode}
            reducedMotion={reducedMotion}
            demoProps={demoProps}
            specimenKey={`${activeExperiment.id}-${specimenEpoch}`}
            headingRef={activeHeadingRef}
            onSelectFamily={selectFamily}
            onOpenCatalog={openCatalog}
            onResetSpecimen={resetSpecimen}
            onInspectorExpand={section => onEvent('System', 'inspector section expanded', section)}
          />
        ) : (
          <CatalogView
            activeId={location.experimentId}
            completedIds={completedIds}
            onOpenWorkspace={selectFamily}
          />
        )}
      </main>

      <footer className="site-footer">
        <span>DESIGN → PROTOTYPE → TEST → THEN REFACTOR</span>
        <span>Independent speculative research by Amy Do / UNDONE by design.</span>
      </footer>
    </div>
  )
}
