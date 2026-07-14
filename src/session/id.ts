export type SessionEntityKind = 'session' | 'trial' | 'event'
export type SessionIdFactory = (kind: SessionEntityKind) => string

export const cryptoSessionIdFactory: SessionIdFactory = kind => {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto)
  if (!randomUUID) throw new Error('crypto.randomUUID is required for persistent session identifiers.')
  return `${kind}_${randomUUID()}`
}

export function createSequentialSessionIdFactory(prefix = 'local'): SessionIdFactory {
  let sequence = 0
  return kind => {
    sequence += 1
    return `${prefix}_${kind}_${String(sequence).padStart(4, '0')}`
  }
}
