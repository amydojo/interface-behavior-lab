import { describe, expect, it } from 'vitest'
import { createSequentialSessionIdFactory } from './id'
import { clearStoredSession, loadSession, saveSession, SESSION_STORAGE_KEY } from './persistence'
import { TrialSessionRecorder } from './recorder'

class MemoryStorage {
  private values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

function createSession() {
  return new TrialSessionRecorder({
    settings: {
      inputContext: 'keyboard' as never,
      materialMode: 'light',
      reducedMotion: true,
      assistance: 0,
      conditionOrder: 'conventional-first',
    },
  }, {
    ids: createSequentialSessionIdFactory('persist'),
    time: {
      wallNow: () => new Date('2026-07-14T12:00:00.000Z'),
      monotonicNow: () => 0,
    },
  }).getSnapshot()
}

describe('session persistence', () => {
  it('saves and restores an unexpired V2 session', () => {
    const storage = new MemoryStorage()
    const session = createSession()
    const saved = saveSession(storage, session, {
      now: new Date('2026-07-14T12:00:00.000Z'),
      retentionMs: 60_000,
    })
    const loaded = loadSession(storage, { now: new Date('2026-07-14T12:00:30.000Z') })

    expect(saved).toEqual({
      ok: true,
      savedAt: '2026-07-14T12:00:00.000Z',
      expiresAt: '2026-07-14T12:01:00.000Z',
    })
    expect(loaded).toEqual(expect.objectContaining({ status: 'loaded', session }))
  })

  it('discards expired, corrupt, and unsupported records instead of throwing', () => {
    const storage = new MemoryStorage()
    const session = createSession()
    saveSession(storage, session, {
      now: new Date('2026-07-14T12:00:00.000Z'),
      retentionMs: 1_000,
    })
    expect(loadSession(storage, { now: new Date('2026-07-14T12:00:02.000Z') })).toEqual({
      status: 'discarded',
      reason: 'expired',
    })
    expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull()

    storage.setItem(SESSION_STORAGE_KEY, '{broken')
    expect(loadSession(storage)).toEqual({ status: 'discarded', reason: 'invalid-json' })

    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ schemaVersion: 1 }))
    expect(loadSession(storage)).toEqual({ status: 'discarded', reason: 'unsupported-schema' })
  })

  it('clears stored session data explicitly', () => {
    const storage = new MemoryStorage()
    saveSession(storage, createSession())
    expect(storage.getItem(SESSION_STORAGE_KEY)).not.toBeNull()
    expect(clearStoredSession(storage)).toEqual({ ok: true })
    expect(loadSession(storage)).toEqual({ status: 'empty' })
  })
})
