import { SESSION_SCHEMA_VERSION, type LabSessionV2 } from './types'

export const SESSION_STORAGE_KEY = 'interface-behavior-lab:session:v2'
export const DEFAULT_SESSION_RETENTION_MS = 24 * 60 * 60 * 1000

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

type SessionEnvelope = {
  schemaVersion: typeof SESSION_SCHEMA_VERSION
  savedAt: string
  expiresAt: string
  session: LabSessionV2
}

export type PersistenceFailureReason =
  | 'storage-error'
  | 'invalid-json'
  | 'unsupported-schema'
  | 'invalid-session'
  | 'expired'

export type SaveSessionResult =
  | { ok: true; savedAt: string; expiresAt: string }
  | { ok: false; reason: 'storage-error' }

export type LoadSessionResult =
  | { status: 'empty' }
  | { status: 'loaded'; session: LabSessionV2; savedAt: string; expiresAt: string }
  | { status: 'discarded'; reason: Exclude<PersistenceFailureReason, 'storage-error'> }
  | { status: 'unavailable'; reason: 'storage-error' }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isLabSessionV2(value: unknown): value is LabSessionV2 {
  if (!isRecord(value)) return false
  if (value.schemaVersion !== SESSION_SCHEMA_VERSION) return false
  if (typeof value.sessionId !== 'string' || typeof value.startedAt !== 'string') return false
  if (value.consent !== 'local-observation-only') return false
  if (!isRecord(value.settingsSnapshot)) return false
  if (!Array.isArray(value.trials) || !Array.isArray(value.events)) return false

  let expectedSequence = 1
  for (const event of value.events) {
    if (!isRecord(event) || event.schemaVersion !== SESSION_SCHEMA_VERSION) return false
    if (typeof event.eventId !== 'string' || typeof event.sequence !== 'number') return false
    if (event.sequence !== expectedSequence) return false
    expectedSequence += 1
  }
  return true
}

function discard(storage: StorageLike, reason: Exclude<PersistenceFailureReason, 'storage-error'>): LoadSessionResult {
  try {
    storage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    return { status: 'unavailable', reason: 'storage-error' }
  }
  return { status: 'discarded', reason }
}

export function saveSession(
  storage: StorageLike,
  session: LabSessionV2,
  options: { now?: Date; retentionMs?: number } = {},
): SaveSessionResult {
  const now = options.now ?? new Date()
  const retentionMs = options.retentionMs ?? DEFAULT_SESSION_RETENTION_MS
  const expiresAt = new Date(now.getTime() + Math.max(0, retentionMs))
  const envelope: SessionEnvelope = {
    schemaVersion: SESSION_SCHEMA_VERSION,
    savedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    session,
  }

  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(envelope))
    return { ok: true, savedAt: envelope.savedAt, expiresAt: envelope.expiresAt }
  } catch {
    return { ok: false, reason: 'storage-error' }
  }
}

export function loadSession(
  storage: StorageLike,
  options: { now?: Date } = {},
): LoadSessionResult {
  let raw: string | null
  try {
    raw = storage.getItem(SESSION_STORAGE_KEY)
  } catch {
    return { status: 'unavailable', reason: 'storage-error' }
  }
  if (raw === null) return { status: 'empty' }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return discard(storage, 'invalid-json')
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== SESSION_SCHEMA_VERSION) {
    return discard(storage, 'unsupported-schema')
  }
  if (
    typeof parsed.savedAt !== 'string'
    || typeof parsed.expiresAt !== 'string'
    || !isLabSessionV2(parsed.session)
  ) {
    return discard(storage, 'invalid-session')
  }

  const now = options.now ?? new Date()
  const expiry = Date.parse(parsed.expiresAt)
  if (!Number.isFinite(expiry) || expiry <= now.getTime()) return discard(storage, 'expired')

  return {
    status: 'loaded',
    session: structuredClone(parsed.session),
    savedAt: parsed.savedAt,
    expiresAt: parsed.expiresAt,
  }
}

export function clearStoredSession(storage: StorageLike): { ok: true } | { ok: false; reason: 'storage-error' } {
  try {
    storage.removeItem(SESSION_STORAGE_KEY)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'storage-error' }
  }
}
