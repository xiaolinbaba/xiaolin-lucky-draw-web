const UINT32_RANGE = 0x1_0000_0000

/**
 * Return an unbiased cryptographically strong integer in [0, maxExclusive).
 */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > UINT32_RANGE) {
    throw new RangeError('maxExclusive must be an integer between 1 and 2^32')
  }

  const randomValues = new Uint32Array(1)
  const rejectionLimit = UINT32_RANGE - (UINT32_RANGE % maxExclusive)

  do {
    globalThis.crypto.getRandomValues(randomValues)
  } while (randomValues[0] >= rejectionLimit)

  return randomValues[0] % maxExclusive
}

export function sampleWithoutReplacement<T>(items: readonly T[], count: number): T[] {
  const pool = [...items]
  const sampleSize = Math.min(Math.max(0, Math.floor(count)), pool.length)

  for (let index = 0; index < sampleSize; index++) {
    const selectedIndex = index + secureRandomInt(pool.length - index)
    const selectedItem = pool[selectedIndex]
    pool[selectedIndex] = pool[index]
    pool[index] = selectedItem
  }

  return pool.slice(0, sampleSize)
}

export function selectAvailableIndex(usedIndexes: readonly number[], length: number): number | null {
  if (!Number.isSafeInteger(length) || length <= 0) {
    return null
  }

  const used = new Set(usedIndexes)
  const available = Array.from({ length }, (_, index) => index).filter(index => !used.has(index))
  if (available.length === 0) {
    return null
  }

  return available[secureRandomInt(available.length)]
}
