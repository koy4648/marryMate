export function workspacePreferenceKey(userId: number) {
  return `marry-mate:v2:workspace:${userId}`
}

export function preferredWorkspaceId(defaultId: number | null, remembered: string | null) {
  if (!remembered) return defaultId
  const parsed = Number(remembered)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : defaultId
}
