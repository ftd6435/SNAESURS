import { CheckCircle2, XCircle, Clock, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: 'approved' | 'pending' | 'rejected' | 'active' | 'inactive' | boolean
  label?: string
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  let variant: 'default' | 'primary' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' = 'default'
  let icon = null
  let displayLabel = label || ''

  if (typeof status === 'boolean') {
    if (status) {
      variant = 'success'
      displayLabel = label || 'Actif'
      icon = <CheckCircle2 className="w-3 h-3 mr-1" />
    } else {
      variant = 'destructive'
      displayLabel = label || 'Inactif'
      icon = <XCircle className="w-3 h-3 mr-1" />
    }
  } else {
    switch (status) {
      case 'approved':
        variant = 'success'
        displayLabel = label || 'Approuvé'
        icon = <CheckCircle2 className="w-3 h-3 mr-1" />
        break
      case 'pending':
        variant = 'warning'
        displayLabel = label || 'En attente'
        icon = <Clock className="w-3 h-3 mr-1" />
        break
      case 'rejected':
        variant = 'destructive'
        displayLabel = label || 'Rejeté'
        icon = <XCircle className="w-3 h-3 mr-1" />
        break
      case 'active':
        variant = 'success'
        displayLabel = label || 'Actif'
        icon = <CheckCircle2 className="w-3 h-3 mr-1" />
        break
      case 'inactive':
        variant = 'outline'
        displayLabel = label || 'Inactif'
        icon = <Ban className="w-3 h-3 mr-1" />
        break
    }
  }

  return (
    <Badge variant={variant} className="flex items-center">
      {icon}
      {displayLabel}
    </Badge>
  )
}
