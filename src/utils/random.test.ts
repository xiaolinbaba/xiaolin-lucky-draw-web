import { describe, expect, it } from 'vitest'
import { sampleWithoutReplacement, secureRandomInt, selectAvailableIndex } from './random'

describe('secure random helpers', () => {
  it('returns values inside the requested range', () => {
    for (let index = 0; index < 100; index++) {
      const value = secureRandomInt(7)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(7)
    }
  })

  it('samples without mutating the source or returning duplicates', () => {
    const source = [1, 2, 3, 4, 5]
    const result = sampleWithoutReplacement(source, 4)

    expect(source).toEqual([1, 2, 3, 4, 5])
    expect(result).toHaveLength(4)
    expect(new Set(result).size).toBe(4)
  })

  it('returns null when no visual slot is available', () => {
    expect(selectAvailableIndex([0, 1, 2], 3)).toBeNull()
  })
})
