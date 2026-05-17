import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/types/user'

interface RoleBadgeProps {
  role: UserRole
}

const roleColors: Record<UserRole, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'outline'> = {
  super_admin: 'primary',
  admin: 'primary',
  tresorier: 'warning',
  secretaire: 'secondary',
  membre: 'outline',
}

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  tresorier: 'Trésorier',
  secretaire: 'Secrétaire',
  membre: 'Membre',
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <Badge variant={roleColors[role]}>
      {roleLabels[role]}
    </Badge>
  )
}
