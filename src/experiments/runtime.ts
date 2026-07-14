import { useCallback, useEffect, useRef, useState } from 'react'
import type { DemoProps } from '../types'
import type { ExperimentAction, ExperimentDefinition, ExperimentEffect, ExperimentState } from './types'

export type ExperimentClock = {
  now: () => number
  setTimeout: (callback: () => void, delayMs: number) => number
  clearTimeout: (handle: number) => void
  setInterval: (callback: () => void, intervalMs: number) => number
  clearInterval: (handle: number) => void
}

export const browserExperimentClock: ExperimentClock = {
  now: () => performance.now(),
  setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearTimeout: handle => window.clearTimeout(handle),
  setInterval: (callback, intervalMs) => window.setInterval(callback, intervalMs),
  clearInterval: handle => window.clearInterval(handle),
}

type TimerRecord = {
  kind: 'timeout' | 'interval'
  handle: number
}

export function useExperimentController<
  S extends ExperimentState,
  A extends ExperimentAction,
>(
  definition: ExperimentDefinition<S, A>,
  props: DemoProps,
  clock: ExperimentClock = browserExperimentClock,
) {
  const [state, setState] = useState<S>(() => definition.reset())
  const stateRef = useRef(state)
  const definitionRef = useRef(definition)
  const propsRef = useRef(props)
  const clockRef = useRef(clock)
  const timersRef = useRef(new Map<string, TimerRecord>())
  const generationRef = useRef(0)
  const mountedRef = useRef(true)
  const dispatchRef = useRef<(action: A) => void>(() => undefined)

  definitionRef.current = definition
  propsRef.current = props
  clockRef.current = clock

  const notifyState = useCallback((next: S) => {
    propsRef.current.onStateChange?.(next.id)
  }, [])

  const cancelTimer = useCallback((timerId: string) => {
    const timer = timersRef.current.get(timerId)
    if (!timer) return
    if (timer.kind === 'timeout') clockRef.current.clearTimeout(timer.handle)
    else clockRef.current.clearInterval(timer.handle)
    timersRef.current.delete(timerId)
  }, [])

  const cancelAllTimers = useCallback(() => {
    for (const timerId of timersRef.current.keys()) cancelTimer(timerId)
  }, [cancelTimer])

  const processEffects = useCallback((effects: ExperimentEffect<A>[]) => {
    for (const effect of effects) {
      if (effect.type === 'emit') {
        propsRef.current.onEvent(definitionRef.current.family, effect.action, effect.detail)
        continue
      }

      if (effect.type === 'cancel') {
        cancelTimer(effect.timerId)
        continue
      }

      cancelTimer(effect.timerId)
      const generation = generationRef.current
      if (effect.type === 'schedule') {
        const handle = clockRef.current.setTimeout(() => {
          timersRef.current.delete(effect.timerId)
          if (!mountedRef.current || generation !== generationRef.current) return
          dispatchRef.current(effect.action)
        }, effect.delayMs)
        timersRef.current.set(effect.timerId, { kind: 'timeout', handle })
        continue
      }

      const handle = clockRef.current.setInterval(() => {
        if (!mountedRef.current || generation !== generationRef.current) return
        dispatchRef.current(effect.action)
      }, effect.intervalMs)
      timersRef.current.set(effect.timerId, { kind: 'interval', handle })
    }
  }, [cancelTimer])

  const dispatch = useCallback((action: A) => {
    if (!mountedRef.current) return
    const currentProps = propsRef.current
    const result = definitionRef.current.transition(stateRef.current, action, {
      now: clockRef.current.now(),
      inputContext: currentProps.modality,
      reducedMotion: currentProps.reducedMotion,
      assistance: currentProps.assistance,
    })
    stateRef.current = result.state
    setState(result.state)
    notifyState(result.state)
    processEffects(result.effects)
  }, [notifyState, processEffects])

  dispatchRef.current = dispatch

  const reset = useCallback(() => {
    generationRef.current += 1
    cancelAllTimers()
    const next = definitionRef.current.reset()
    stateRef.current = next
    setState(next)
    notifyState(next)
  }, [cancelAllTimers, notifyState])

  useEffect(() => {
    mountedRef.current = true
    notifyState(stateRef.current)
    return () => {
      mountedRef.current = false
      generationRef.current += 1
      cancelAllTimers()
    }
  }, [cancelAllTimers, notifyState])

  return { state, dispatch, reset }
}
