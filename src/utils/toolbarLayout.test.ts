import { describe, expect, it } from 'vitest'
import { hiddenToolbarGroups, isToolbarGroupVisible, nextToolbarDensity } from './toolbarLayout'

describe('responsive toolbar layout', () => {
  it('reduces density one step at a time when measured content overflows', () => {
    expect(nextToolbarDensity('full', true)).toBe('medium')
    expect(nextToolbarDensity('medium', true)).toBe('compact')
    expect(nextToolbarDensity('compact', true)).toBe('minimal')
    expect(nextToolbarDensity('minimal', true)).toBe('minimal')
  })

  it('does not reduce density when controls fit', () => {
    expect(nextToolbarDensity('full', false)).toBe('full')
    expect(nextToolbarDensity('medium', false)).toBe('medium')
  })

  it('keeps display modes visible at every density', () => {
    for (const density of ['full', 'medium', 'compact', 'minimal'] as const) {
      expect(isToolbarGroupVisible('displayModes', density)).toBe(true)
    }
  })

  it('moves lower-priority controls into overflow as space shrinks', () => {
    expect(isToolbarGroupVisible('utilities', 'full')).toBe(true)
    expect(isToolbarGroupVisible('utilities', 'medium')).toBe(false)
    expect(isToolbarGroupVisible('secondary', 'compact')).toBe(false)
    expect(isToolbarGroupVisible('compactOptional', 'compact')).toBe(true)
    expect(isToolbarGroupVisible('compactOptional', 'minimal')).toBe(false)
  })

  it('reports exactly the groups that belong in the overflow menu', () => {
    expect(hiddenToolbarGroups('full')).toEqual([])
    expect(hiddenToolbarGroups('medium')).toEqual(['utilities'])
    expect(hiddenToolbarGroups('compact')).toEqual(['secondary', 'utilities'])
    expect(hiddenToolbarGroups('minimal')).toEqual(['compactOptional', 'secondary', 'utilities'])
  })
})
