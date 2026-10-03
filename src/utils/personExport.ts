import type { IPersonConfig } from '@/types/storeType'

const omittedFields = new Set(['x', 'y', 'id', 'avatar', 'createTime', 'updateTime', 'prizeId'])
const translatedFields = ['uid', 'name', 'department', 'identity', 'isWin', 'prizeName', 'prizeTime'] as const

export function buildPersonExportRows(people: readonly IPersonConfig[], translate: (key: string) => string) {
  const columns = new Map(translatedFields.map(field => [field as string, translate(`data.${field === 'uid' ? 'number' : field}`)]))
  return people.map(person => Object.fromEntries(
    Object.entries(person)
      .filter(([field]) => !omittedFields.has(field))
      .map(([field, value]) => {
        if (field === 'isWin') {
          value = translate(value ? 'data.yes' : 'data.no')
        }
        else if (field === 'prizeName' || field === 'prizeTime') {
          value = value.join(',')
        }
        return [columns.get(field) ?? field, value]
      }),
  ))
}
