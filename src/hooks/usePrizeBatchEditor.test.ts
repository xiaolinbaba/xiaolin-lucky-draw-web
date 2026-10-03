import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePrizeConfig } from '@/store/prizeConfig'
import { usePrizeBatchEditor } from './usePrizeBatchEditor'

describe('prize batch editing', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function setup() {
    const prize = usePrizeConfig().prizeConfig.prizeList[0]
    prize.count = 5
    prize.isUsedCount = 3
    prize.separateCount = {
      enable: true,
      countList: [{ id: 'first', count: 2, isUsedCount: 2 }, { id: 'second', count: 3, isUsedCount: 1 }],
    }
    return { prize, editor: usePrizeBatchEditor() }
  }

  it('keeps persisted progress unchanged while a draft is opened or edited', () => {
    const { prize, editor } = setup()
    const before = JSON.stringify(prize)
    editor.selectPrize(prize)
    editor.selectedPrize.value!.separateCount.countList[0].count = 1

    expect(JSON.stringify(prize)).toBe(before)
    expect(prize.isUsedCount).toBe(3)
  })

  it('retains existing batch counters when boundaries are unchanged', () => {
    const { prize, editor } = setup()
    // Existing history need not be a prefix after removing individual winners.
    prize.separateCount.countList[0].isUsedCount = 1
    prize.separateCount.countList[1].isUsedCount = 2
    editor.selectPrize(prize)
    editor.submitData([{ id: '1', count: 2, isUsedCount: 0 }, { id: '2', count: 3, isUsedCount: 0 }])

    expect(prize.separateCount.countList.map(batch => batch.isUsedCount)).toEqual([1, 2])
    expect(prize.isUsedCount).toBe(3)
    expect(editor.selectedPrize.value).toBeNull()
  })

  it('redistributes prior wins into changed batches without resetting total progress', () => {
    const { prize, editor } = setup()
    editor.selectPrize(prize)
    editor.submitData([{ id: '1', count: 1, isUsedCount: 0 }, { id: '2', count: 4, isUsedCount: 0 }])

    expect(prize.separateCount.countList.map(batch => batch.isUsedCount)).toEqual([1, 2])
    expect(prize.isUsedCount).toBe(3)
    expect(prize.isUsed).toBe(false)
  })

  it('keeps a completed prize completed when editing previously unbatched progress', () => {
    const { prize, editor } = setup()
    prize.isUsedCount = 5
    prize.isUsed = true
    prize.separateCount = { enable: false, countList: [] }
    editor.selectPrize(prize)
    expect(prize.separateCount.countList).toEqual([])
    editor.submitData([{ id: '1', count: 2, isUsedCount: 0 }, { id: '2', count: 3, isUsedCount: 0 }])

    expect(prize.separateCount.countList.map(batch => batch.isUsedCount)).toEqual([2, 3])
    expect(prize.isUsedCount).toBe(5)
    expect(prize.isUsed).toBe(true)
  })
})
