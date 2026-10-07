import z from 'zod'

const integer = (min: number, max: number) => z.number().int().min(min).max(max)
const id = z.union([z.string(), z.number().finite()])
const media = z.object({ id, name: z.string(), url: z.string() })
const batch = z.object({ id: z.string(), count: integer(1, 20000), isUsedCount: integer(0, 20000) })
const prize = z.object({
  id,
  name: z.string(),
  sort: z.number().finite(),
  isAll: z.boolean(),
  count: integer(1, 20000),
  isUsedCount: integer(0, 20000),
  picture: media,
  separateCount: z.object({ enable: z.boolean(), countList: z.array(batch).max(20000) }),
  desc: z.string(),
  isShow: z.boolean(),
  isUsed: z.boolean(),
  frequency: z.number().finite(),
}).refine(p => p.isUsedCount <= p.count && (!p.separateCount.countList.length || (
  p.separateCount.countList.every(b => b.isUsedCount <= b.count)
  && p.separateCount.countList.reduce((sum, b) => sum + b.count, 0) === p.count
  && p.separateCount.countList.reduce((sum, b) => sum + b.isUsedCount, 0) === p.isUsedCount
)))
const person = z.object({
  id: z.number().finite(),
  uid: z.string(),
  name: z.string(),
  department: z.string(),
  identity: z.string(),
  avatar: z.string(),
  isWin: z.boolean(),
  x: z.number().finite().default(1),
  y: z.number().finite().default(1),
  createTime: z.string(),
  updateTime: z.string(),
  prizeName: z.array(z.string()),
  prizeId: z.array(z.string()),
  prizeTime: z.array(z.string()),
}).passthrough()
export const configSchemas = {
  globalConfig: z.object({ globalConfig: z.object({
    rowCount: integer(1, 100),
    isSHowPrizeList: z.boolean(),
    isShowAvatar: z.boolean().optional(),
    topTitle: z.string(),
    language: z.enum(['en', 'zhCn']),
    theme: z.object({
      name: z.string(),
      detail: z.record(z.unknown()),
      cardColor: z.string(),
      cardWidth: integer(20, 1000),
      cardHeight: integer(20, 1000),
      textColor: z.string(),
      luckyCardColor: z.string(),
      textSize: integer(8, 200),
      patternColor: z.string(),
      patternList: z.array(integer(0, 1000000)),
      background: media.partial(),
    }),
    musicList: z.array(media).max(1000),
    musicVolume: integer(0, 100).default(100),
    musicMuted: z.boolean().default(false),
    imageList: z.array(media).max(1000),
  }) }),
  personConfig: z.object({ personConfig: z.object({
    allPersonList: z.array(person).max(100000),
    alreadyPersonList: z.array(person).max(100000),
  }).refine(p => new Set(p.allPersonList.map(person => person.id)).size === p.allPersonList.length) }),
  prizeConfig: z.object({ prizeConfig: z.object({
    prizeList: z.array(prize).max(1000),
    currentPrize: prize,
    temporaryPrize: prize,
  }) }),
}
export type ConfigKey = keyof typeof configSchemas
export const configKeys = Object.keys(configSchemas) as ConfigKey[]

export function hasUnsafeKeys(value: unknown): boolean {
  if (!value || typeof value !== 'object')
    return false
  return Object.entries(value).some(([key, item]) => key === '__proto__' || key === 'prototype'
    || (key === 'constructor' && typeof item === 'object') || hasUnsafeKeys(item))
}

export function parseConfig(key: ConfigKey, value: unknown) {
  if (hasUnsafeKeys(value))
    throw new Error('Invalid configuration keys')
  return configSchemas[key].parse(value)
}
