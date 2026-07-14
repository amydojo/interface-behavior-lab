import { experimentById } from '../experiments/registry'
import type { ExperimentId } from '../experiments/types'

export type WorkspaceView = 'workspace' | 'catalog'

export type WorkspaceLocation = {
  view: WorkspaceView
  experimentId: ExperimentId
}

export const defaultExperimentId: ExperimentId = 'intent'

function isExperimentId(value: string): value is ExperimentId {
  return Object.prototype.hasOwnProperty.call(experimentById, value)
}

export function parseWorkspaceHash(hash: string): { location: WorkspaceLocation; valid: boolean } {
  const normalized = hash.replace(/^#/, '').replace(/^\//, '')

  if (normalized === 'catalog') {
    return {
      location: { view: 'catalog', experimentId: defaultExperimentId },
      valid: true,
    }
  }

  const match = /^lab\/([^/]+)$/.exec(normalized)
  if (match && isExperimentId(match[1])) {
    return {
      location: { view: 'workspace', experimentId: match[1] },
      valid: true,
    }
  }

  return {
    location: { view: 'workspace', experimentId: defaultExperimentId },
    valid: normalized.length === 0,
  }
}

export function workspaceHash(location: WorkspaceLocation) {
  return location.view === 'catalog' ? '#catalog' : `#lab/${location.experimentId}`
}
