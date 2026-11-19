export const navigationItems = [{ id: 'dashboard', label: '홈' }, { id: 'checklist', label: '준비 체크' }, { id: 'meals', label: '청모' }, { id: 'compare', label: '업체 비교' }, { id: 'packages', label: '패키지' }, { id: 'calendar', label: '캘린더' }, { id: 'budget', label: '예산' }] as const
export type View = typeof navigationItems[number]['id']
export const allMenus: View[] = navigationItems.map(item => item.id)

export function normalizeMenuOrder(menus: readonly string[]): View[] {
  const known = new Set<string>(allMenus)
  const ordered = [...new Set(menus)].filter((id): id is View => known.has(id))
  return ordered.includes('dashboard') ? ordered : ['dashboard', ...ordered]
}

export function moveMenu(menus: readonly View[], id: View, direction: -1 | 1): View[] {
  const from = menus.indexOf(id)
  const to = from + direction
  const next = [...menus]
  if (from < 0 || to < 0 || to >= next.length) return next
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}
