import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useStore from '@/store'
import { restoreBackup, validateBackup } from './backup'
import { getRecoveryData, safeConfigStorage } from './persistence'

const db = vi.hoisted(() => new Map<string, Map<string, string>>())
const fail = vi.hoisted(() => ({ next: false }))
vi.mock('localforage', () => ({ default: { createInstance: ({ name }: { name: string }) => {
  if (!db.has(name))
    db.set(name, new Map())
  return {
    keys: async () => [...db.get(name)!.keys()],
    getItem: async (key: string) => db.get(name)!.get(key) ?? null,
    removeItem: async (key: string) => { db.get(name)!.delete(key) },
    setItem: async (key: string, value: string) => {
      if (fail.next) {
        fail.next = false
        throw new Error('QuotaExceededError')
      }
      db.get(name)!.set(key, value)
    },
  }
} } }))

function fixture() {
  const stores = useStore()
  return JSON.parse(JSON.stringify({ format: 'luck-backup', version: 1, createdAt: '2026-10-03', global: { globalConfig: stores.globalConfig.globalConfig }, people: { personConfig: stores.personConfig.personConfig }, prizes: { prizeConfig: stores.prizeConfig.prizeConfig }, images: [], audio: [] }))
}
describe('backup restoration and damaged storage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    for (const data of db.values()) data.clear()
    fail.next = false
  })
  it('accepts a complete event and rejects partial or unsafe configuration', () => {
    const backup = fixture()
    expect(validateBackup(backup).prizes.prizeConfig.prizeList.length).toBeGreaterThan(0)
    backup.people = {}
    expect(() => validateBackup(backup)).toThrow()
    const unsafe = fixture()
    unsafe.global.globalConfig.theme.detail = JSON.parse('{"__proto__":{"polluted":true}}')
    expect(() => validateBackup(unsafe)).toThrow()
    expect(({} as any).polluted).toBeUndefined()
  })
  it('reads older backups and saved events without resetting their configuration', () => {
    const old = fixture()
    old.global.globalConfig.topTitle = 'Existing event'
    delete old.global.globalConfig.musicVolume
    delete old.global.globalConfig.musicMuted
    localStorage.setItem('globalConfig', JSON.stringify(old.global))
    const restored = JSON.parse(safeConfigStorage.getItem('globalConfig')!)
    expect(restored.globalConfig.topTitle).toBe('Existing event')
    expect(restored.globalConfig.musicList).toEqual(old.global.globalConfig.musicList)
    expect(restored.globalConfig.musicVolume).toBe(100)
    expect(restored.globalConfig.musicMuted).toBe(false)
    expect(validateBackup(old).global.globalConfig).toEqual(restored.globalConfig)
  })
  it('rejects missing media references', () => {
    const backup = fixture()
    backup.global.globalConfig.imageList.push({ id: 'missing', name: 'missing', url: 'Storage' })
    expect(() => validateBackup(backup)).toThrow('Missing media')
  })
  it('restores uploaded media and configuration as one complete event', async () => {
    const backup = fixture()
    backup.images = [['new', 'data:image/png;base64,AA==']]
    db.get('imgStore')!.set('old', 'data:image/png;base64,BB==')
    await restoreBackup(validateBackup(backup))
    expect([...db.get('imgStore')!.keys()]).toEqual(['new'])
    expect(JSON.parse(localStorage.getItem('prizeConfig')!)).toEqual(backup.prizes)
  })
  it('rolls back old media and configuration when a write fails', async () => {
    const backup = fixture()
    backup.images = [['new', 'data:image/png;base64,AA==']]
    localStorage.setItem('prizeConfig', JSON.stringify(backup.prizes))
    const oldConfig = localStorage.getItem('prizeConfig')
    db.get('imgStore')!.set('old', 'data:image/png;base64,BB==')
    fail.next = true
    await expect(restoreBackup(validateBackup(backup))).rejects.toThrow('QuotaExceededError')
    expect([...db.get('imgStore')!.entries()]).toEqual([['old', 'data:image/png;base64,BB==']])
    expect(localStorage.getItem('prizeConfig')).toBe(oldConfig)
  })
  it('preserves exact damaged JSON before saving valid defaults', () => {
    localStorage.setItem('personConfig', '{broken')
    expect(safeConfigStorage.getItem('personConfig')).toBeNull()
    safeConfigStorage.setItem('personConfig', JSON.stringify(fixture().people))
    expect(getRecoveryData().personConfig).toBe('{broken')
    expect(safeConfigStorage.getItem('personConfig')).not.toBeNull()
  })
  it('rolls back media and earlier configuration writes when persistence fails midway', async () => {
    const old = fixture()
    const next = fixture()
    next.global.globalConfig.topTitle = 'Replacement'
    next.images = [['new', 'data:image/png;base64,AA==']]
    for (const [key, value] of [['globalConfig', old.global], ['personConfig', old.people], ['prizeConfig', old.prizes]] as const) {
      localStorage.setItem(key, JSON.stringify(value))
    }
    db.get('imgStore')!.set('old', 'data:image/png;base64,BB==')
    const write = Storage.prototype.setItem
    let failed = false
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'personConfig' && !failed) {
        failed = true
        throw new DOMException('Full', 'QuotaExceededError')
      }
      write.call(this, key, value)
    })
    try {
      await expect(restoreBackup(validateBackup(next))).rejects.toThrow('Full')
      expect(JSON.parse(localStorage.getItem('globalConfig')!)).toEqual(old.global)
      expect(JSON.parse(localStorage.getItem('personConfig')!)).toEqual(old.people)
      expect([...db.get('imgStore')!.entries()]).toEqual([['old', 'data:image/png;base64,BB==']])
    }
    finally { spy.mockRestore() }
  })
})
