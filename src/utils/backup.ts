import localforage from 'localforage'
import z from 'zod'
import { configSchemas, hasUnsafeKeys, parseConfig } from './configSchema'

export const maxBackupSize = 200 * 1024 * 1024
const imageStore = localforage.createInstance({ name: 'imgStore' })
const audioStore = localforage.createInstance({ name: 'audioStore' })
const mediaEntries = z.array(z.tuple([z.string(), z.string()])).max(1000)
const schema = z.object({
  format: z.literal('luck-backup'),
  version: z.literal(1),
  createdAt: z.string(),
  global: configSchemas.globalConfig,
  people: configSchemas.personConfig,
  prizes: configSchemas.prizeConfig,
  images: mediaEntries,
  audio: mediaEntries,
})
export type Backup = z.infer<typeof schema>

export function validateBackup(value: unknown): Backup {
  if (hasUnsafeKeys(value))
    throw new Error('Invalid backup keys')
  const backup = schema.parse(value)
  for (const [entries, prefix] of [[backup.images, 'image/'], [backup.audio, 'audio/']] as const) {
    if (new Set(entries.map(([key]) => key)).size !== entries.length
      || entries.some(([key, data]) => !key || !data.startsWith(`data:${prefix}`))) {
      throw new Error('Invalid media')
    }
  }
  const imageKeys = new Set(backup.images.map(([key]) => key))
  const audioKeys = new Set(backup.audio.map(([key]) => key))
  const global = backup.global.globalConfig
  const pictures = [...backup.prizes.prizeConfig.prizeList, backup.prizes.prizeConfig.currentPrize, backup.prizes.prizeConfig.temporaryPrize].map(p => p.picture)
  pictures.push({ id: global.theme.background.id ?? '', name: global.theme.background.name ?? '', url: global.theme.background.url ?? '' })
  if (global.imageList.some(m => m.url === 'Storage' && !imageKeys.has(String(m.id)))
    || pictures.some(m => m.url === 'Storage' && !imageKeys.has(String(m.id)))
    || global.musicList.some(m => m.url === 'Storage' && !audioKeys.has(m.name))) {
    throw new Error('Missing media')
  }
  return backup
}

async function readMedia(store: LocalForage) {
  const entries: Array<[string, string]> = []
  for (const key of await store.keys()) {
    const value = await store.getItem<string>(key)
    if (value !== null)
      entries.push([key, value])
  }
  return entries
}

export async function createBackup(global: unknown, people: unknown, prizes: unknown) {
  const snapshot = JSON.parse(JSON.stringify({ global, people, prizes }))
  const [images, audio] = await Promise.all([readMedia(imageStore), readMedia(audioStore)])
  const backup = validateBackup({ format: 'luck-backup', version: 1, createdAt: new Date().toISOString(), ...snapshot, images, audio })
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  if (blob.size > maxBackupSize)
    throw new Error('Backup exceeds size limit')
  return blob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Keep a rollback copy of every affected value until all writes complete.
export async function restoreBackup(backup: Backup) {
  const stores = [[imageStore, backup.images], [audioStore, backup.audio]] as const
  const oldMedia: Array<[LocalForage, string, string | null]> = []
  const configs = [['globalConfig', backup.global], ['personConfig', backup.people], ['prizeConfig', backup.prizes]] as const
  const oldConfig = configs.map(([key]) => [key, localStorage.getItem(key)] as const)
  try {
    for (const [key, raw] of oldConfig) {
      if (!raw)
        continue
      try {
        parseConfig(key, JSON.parse(raw))
      }
      catch { localStorage.setItem(`luck-recovery-${key}`, raw) }
    }
    for (const [store, entries] of stores) {
      const nextKeys = new Set(entries.map(([key]) => key))
      for (const key of await store.keys()) {
        if (!nextKeys.has(key)) {
          oldMedia.push([store, key, await store.getItem<string>(key)])
          await store.removeItem(key)
        }
      }
      for (const [key, value] of entries) {
        oldMedia.push([store, key, await store.getItem<string>(key)])
        await store.setItem(key, value)
      }
    }
    for (const [key, value] of configs) localStorage.setItem(key, JSON.stringify(value))
  }
  catch (error) {
    const rollback = await Promise.allSettled([
      ...oldMedia.map(([store, key, value]) => value === null ? store.removeItem(key) : store.setItem(key, value)),
      ...oldConfig.map(([key, value]) => Promise.resolve().then(() => value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value))),
    ])
    if (rollback.some(result => result.status === 'rejected'))
      throw new Error('rollbackFailed')
    throw error
  }
}
