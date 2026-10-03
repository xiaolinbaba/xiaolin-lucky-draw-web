import type { IPrizeConfig } from '@/types/storeType'

export const numericLimits = {
  rowCount: [1, 100],
  cardWidth: [20, 1000],
  cardHeight: [20, 1000],
  textSize: [8, 200],
  prizeCount: [1, 20000],
} as const

export function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max
}

export function isDrawablePrize(prize: IPrizeConfig) {
  return prize.isShow && !prize.isUsed && isIntegerInRange(prize.count, ...numericLimits.prizeCount)
    && isIntegerInRange(prize.isUsedCount, 0, prize.count) && prize.isUsedCount < prize.count
}

export function getDrawCount(prize: IPrizeConfig, cardCount: number) {
  if (!isDrawablePrize(prize)) {
    return 0
  }
  let remaining = prize.count - prize.isUsedCount
  if (prize.separateCount.enable && prize.separateCount.countList.length) {
    const batches = prize.separateCount.countList
    if (batches.some(batch => !isIntegerInRange(batch.count, 1, prize.count)
      || !isIntegerInRange(batch.isUsedCount, 0, batch.count))
    || batches.reduce((sum, batch) => sum + batch.count, 0) !== prize.count
    || batches.reduce((sum, batch) => sum + batch.isUsedCount, 0) !== prize.isUsedCount) {
      return 0
    }
    const next = batches.find(batch => batch.isUsedCount < batch.count)
    remaining = next ? next.count - next.isUsedCount : 0
  }
  return Math.min(remaining, 10, cardCount)
}
