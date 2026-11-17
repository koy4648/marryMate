import { describe, expect, it } from 'vitest'
import { preferredWorkspaceId, workspacePreferenceKey } from './workspace'

describe('workspace preference', () => {
  it('keeps a separate last workspace for each user', () => {
    expect(workspacePreferenceKey(42)).toBe('marry-mate:v2:workspace:42')
  })

  it('restores a valid remembered workspace after login', () => {
    expect(preferredWorkspaceId(1, '7')).toBe(7)
  })

  it('falls back when the remembered value is invalid', () => {
    expect(preferredWorkspaceId(1, 'not-an-id')).toBe(1)
    expect(preferredWorkspaceId(null, null)).toBeNull()
  })
})
