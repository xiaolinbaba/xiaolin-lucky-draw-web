import type { IPersonConfig } from '@/types/storeType'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePersonConfig } from './personConfig'
import { usePrizeConfig } from './prizeConfig'

function createPerson(): IPersonConfig {
  return {
    id: 1,
    uid: 'P001',
    name: 'Test Person',
    department: 'Engineering',
    identity: 'Engineer',
    avatar: '',
    isWin: false,
    x: 1,
    y: 1,
    createTime: '',
    updateTime: '',
    prizeName: [],
    prizeId: [],
    prizeTime: [],
  }
}

describe('draw state consistency', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('clears the drawable current prize when all prizes are deleted', () => {
    const prizeStore = usePrizeConfig()

    prizeStore.deleteAllPrizeConfig()

    expect(prizeStore.prizeConfig.prizeList).toEqual([])
    expect(prizeStore.prizeConfig.currentPrize.isShow).toBe(false)
  })

  it('rolls back prize and batch counters when a winner is removed', () => {
    const prizeStore = usePrizeConfig()
    const personStore = usePersonConfig()
    const prize = prizeStore.prizeConfig.prizeList[0]
    const person = createPerson()

    prize.isUsed = true
    prize.isUsedCount = 1
    prize.separateCount.countList = [{ id: 'batch-1', count: 1, isUsedCount: 1 }]
    personStore.addNotPersonList([person])
    personStore.addAlreadyPersonList([person], prize)

    personStore.moveAlreadyToNot(person)

    expect(person.isWin).toBe(false)
    expect(person.prizeId).toEqual([])
    expect(prize.isUsed).toBe(false)
    expect(prize.isUsedCount).toBe(0)
    expect(prize.separateCount.countList[0].isUsedCount).toBe(0)
  })

  it('excludes an existing winner when a numeric prize id is persisted as a string', () => {
    const prizeStore = usePrizeConfig()
    const personStore = usePersonConfig()
    const prize = prizeStore.prizeConfig.prizeList[0]
    const person = createPerson()

    prize.id = 101
    prizeStore.setCurrentPrize(prize)
    person.prizeId = ['101']
    personStore.addNotPersonList([person])

    expect(personStore.getNotThisPrizePersonList).toEqual([])
  })

  it('repositions every participant without removing winners or changing prize history', () => {
    const personStore = usePersonConfig()
    const prizeStore = usePrizeConfig()
    const people = Array.from({ length: 5 }, (_, index) => ({ ...createPerson(), id: index + 1, uid: `P${index + 1}` }))
    personStore.addNotPersonList(people)
    const prize = prizeStore.prizeConfig.prizeList[0]
    personStore.addAlreadyPersonList([people[2]], prize)
    prize.isUsedCount = 1
    const before = JSON.stringify(personStore.personConfig)

    personStore.updatePersonLayout(2)

    expect(personStore.getAllPersonList.map(person => person.id)).toEqual([1, 2, 3, 4, 5])
    expect(personStore.getAllPersonList.map(person => [person.x, person.y])).toEqual([[1, 1], [2, 1], [1, 2], [2, 2], [1, 3]])
    expect(personStore.getAlreadyPersonList).toHaveLength(1)
    expect(personStore.getAlreadyPersonDetail).toHaveLength(1)
    expect(personStore.getAlreadyPersonList[0].prizeId).toEqual([String(prize.id)])
    expect(prize.isUsedCount).toBe(1)
    const withoutLayout = (value: string) => JSON.parse(value, (key, item) => key === 'x' || key === 'y' ? undefined : item)
    expect(withoutLayout(JSON.stringify(personStore.personConfig))).toEqual(withoutLayout(before))
  })
})
