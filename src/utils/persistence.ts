import { ref } from 'vue'
import { configKeys, parseConfig } from './configSchema'

export const persistenceIssue = ref('')
const recoveryPrefix = 'luck-recovery-'
const unreadable = new Map<string, string>()

export const safeConfigStorage: Storage = {
  get length() { return localStorage.length },
  key: index => localStorage.key(index),
  clear: () => { throw new Error('Clearing all browser storage is not supported') },
  removeItem: key => localStorage.removeItem(key),
  getItem(key) {
    let raw: string | null = null
    try {
      raw = localStorage.getItem(key)
      if (!raw || !configKeys.includes(key as any))
        return raw
      const valid = parseConfig(key as any, JSON.parse(raw))
      return JSON.stringify(valid)
    }
    catch {
      if (raw)
        unreadable.set(key, raw)
      persistenceIssue.value = 'error.configRecovery'
      return null
    }
  },
  setItem(key, value) {
    try {
      const raw = unreadable.get(key)
      if (raw) {
        // Preserve the original bytes before writing defaults or user changes.
        localStorage.setItem(`${recoveryPrefix}${key}`, raw)
        unreadable.delete(key)
        persistenceIssue.value = 'error.configRecovery'
      }
      localStorage.setItem(key, value)
    }
    catch {
      persistenceIssue.value = 'error.storageFull'
    }
  },
}

export function getRecoveryData() {
  const data: Record<string, string> = {}
  for (const key of configKeys) {
    const saved = localStorage.getItem(`${recoveryPrefix}${key}`)
    if (saved)
      data[key] = saved
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        parseConfig(key, JSON.parse(raw))
      }
      catch { data[key] = raw }
    }
  }
  return data
}
