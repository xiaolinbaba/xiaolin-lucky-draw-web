import type { IPrizeConfig, Separate } from '@/types/storeType'
import { ref } from 'vue'
import { isIntegerInRange, numericLimits } from '@/utils/validation'

export function usePrizeBatchEditor() {
  const selectedPrize = ref<IPrizeConfig | null>(null)
  let originalPrize: IPrizeConfig | null = null

  function selectPrize(prize: IPrizeConfig) {
    if (!isIntegerInRange(prize.count, ...numericLimits.prizeCount))
      return
    originalPrize = prize
    selectedPrize.value = {
      ...prize,
      separateCount: {
        enable: true,
        countList: prize.separateCount.countList.length
          ? prize.separateCount.countList.map(batch => ({ ...batch }))
          : [{ id: '0', count: prize.count, isUsedCount: prize.isUsedCount }],
      },
    }
  }

  function submitData(batches: Separate[]) {
    if (!originalPrize) {
      return
    }
    const previous = originalPrize.separateCount.countList
    const unchanged = previous.length === batches.length && previous.every((batch, index) => batch.count === batches[index].count)
    // Changed boundaries consume existing wins in draw order; never reset totals.
    let remainingWins = originalPrize.isUsedCount
    const countList = batches.map((batch, index) => {
      const isUsedCount = unchanged ? previous[index].isUsedCount : Math.min(batch.count, remainingWins)
      remainingWins -= isUsedCount
      return { ...batch, isUsedCount }
    })
    originalPrize.separateCount = { enable: true, countList }
    originalPrize = null
    selectedPrize.value = null
  }

  return { selectedPrize, selectPrize, submitData }
}
