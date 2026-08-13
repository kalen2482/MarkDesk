export type ToolbarDensity = 'full' | 'medium' | 'compact' | 'minimal'
export type ToolbarGroup = 'common' | 'compactOptional' | 'secondary' | 'utilities' | 'displayModes'

export function nextToolbarDensity(density: ToolbarDensity, isOverflowing: boolean): ToolbarDensity {
  if (!isOverflowing) return density
  if (density === 'full') return 'medium'
  if (density === 'medium') return 'compact'
  if (density === 'compact') return 'minimal'
  return 'minimal'
}

export function isToolbarGroupVisible(group: ToolbarGroup, density: ToolbarDensity): boolean {
  if (group === 'displayModes' || group === 'common') return true
  if (group === 'compactOptional') return density !== 'minimal'
  if (group === 'secondary') return density === 'full' || density === 'medium'
  return density === 'full'
}

export function hiddenToolbarGroups(density: ToolbarDensity): ToolbarGroup[] {
  return (['compactOptional', 'secondary', 'utilities'] as ToolbarGroup[])
    .filter((group) => !isToolbarGroupVisible(group, density))
}
