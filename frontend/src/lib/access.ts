import type { User, UserRole } from '@/types/user'

export function getUserRole(user: User | null | undefined): UserRole | null {
  return user?.role ?? null
}

export function hasActiveStatut(user: User | null | undefined): boolean {
  return (user?.assign_statuts ?? []).some((s) => s.is_active)
}

export function getActiveStructureIds(user: User | null | undefined): number[] {
  return (user?.assign_structures ?? [])
    .filter((s) => s.is_active)
    .map((s) => (s as any).structure_id ?? s.structure?.id)
    .filter((id): id is number => typeof id === 'number')
}

export function isSuperAdmin(user: User | null | undefined): boolean {
  return user?.role === 'super_admin'
}

export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === 'admin'
}

export function isReadonlyMember(user: User | null | undefined): boolean {
  return user?.role === 'membre' && !hasActiveStatut(user)
}

export function canManageAnything(user: User | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isAdmin(user)) return hasActiveStatut(user)
  return hasActiveStatut(user)
}

export function canManageUsers(user: User | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isAdmin(user)) return hasActiveStatut(user)
  return user.role === 'membre' && hasActiveStatut(user)
}

export function canViewUsers(user: User | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isAdmin(user)) return hasActiveStatut(user)
  return user.role === 'membre' && hasActiveStatut(user)
}

export function canToggleUserActive(user: User | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isAdmin(user)) return hasActiveStatut(user)
  return false
}

export function canManageSettings(user: User | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isAdmin(user)) return hasActiveStatut(user)
  return false
}

export function canManageFinancials(user: User | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isAdmin(user)) return hasActiveStatut(user)
  if (user.role === 'tresorier') return hasActiveStatut(user)
  return user.role === 'membre' && hasActiveStatut(user)
}

export function canViewDons(user: User | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isAdmin(user)) return hasActiveStatut(user)
  if (user.role === 'tresorier') return hasActiveStatut(user)
  return user.role === 'membre'
}

export function canAccessBadges(user: User | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isAdmin(user)) return hasActiveStatut(user)
  return user.role === 'membre' && hasActiveStatut(user)
}

export function canManageMeetings(user: User | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isAdmin(user)) return hasActiveStatut(user)
  return user.role === 'secretaire' && hasActiveStatut(user)
}
