import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePrizeConfig } from '@/store/prizeConfig'
import { getDrawCount, isIntegerInRange } from './validation'

describe('draw validation and prize selection', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('rejects empty, fractional, nonfinite and out of range quantities', () => {
    for (const value of [0, -1, 1.5, Number.NaN, Infinity, '', 20001]) expect(isIntegerInRange(value, 1, 20000)).toBe(false)
  })
  it('skips hidden, completed and invalid prizes and prioritizes an active temporary prize', () => {
    const store = usePrizeConfig()
    store.prizeConfig.prizeList[0].isShow = false
    store.prizeConfig.prizeList[1].isUsedCount = store.prizeConfig.prizeList[1].count
    store.prizeConfig.prizeList[2].count = 1.5
    store.selectNextAvailablePrize(true)
    expect(store.getCurrentPrize).toBe(store.prizeConfig.prizeList[3])
    store.prizeConfig.temporaryPrize.isShow = true
    store.prizeConfig.temporaryPrize.id = 'temporary'
    store.selectNextAvailablePrize(true)
    expect(store.getCurrentPrize.id).toBe('temporary')
    store.prizeConfig.temporaryPrize.isUsedCount = 1
    store.selectNextAvailablePrize(true)
    expect(store.getCurrentPrize).toBe(store.prizeConfig.prizeList[3])
  })
  it('rejects inconsistent batch progress and never produces a zero-person valid draw', () => {
    const prize = usePrizeConfig().getCurrentPrize
    prize.count = 5
    prize.isUsedCount = 3
    prize.separateCount = { enable: true, countList: [{ id: '1', count: 1, isUsedCount: 1 }, { id: '2', count: 4, isUsedCount: 2 }] }
    expect(getDrawCount(prize, 200)).toBe(2)
    prize.separateCount.countList[1].isUsedCount = 1
    expect(getDrawCount(prize, 200)).toBe(0)
    prize.count = -1
    expect(getDrawCount(prize, 200)).toBe(0)
  })
})
