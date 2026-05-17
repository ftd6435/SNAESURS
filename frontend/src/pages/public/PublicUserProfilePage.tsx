import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import api from '@/services/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function PublicUserProfilePage() {
  const { code } = useParams()

  const profileQuery = useQuery({
    queryKey: ['public-user', code],
    queryFn: async () => {
      const response = await api.get(`/public/users/${encodeURIComponent(String(code ?? ''))}`)
      return response.data
    },
    enabled: !!code,
    retry: false,
  })

  const payload = profileQuery.data as any
  const user = payload?.data

  const initials = (name: string | undefined) =>
    (name || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const roleLabel = (role: string | undefined) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'admin':
        return 'Administrateur'
      case 'membre':
        return 'Membre'
      default:
        return role || '-'
    }
  }

  if (!code) {
    return (
      <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Profil introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Code manquant.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (profileQuery.isError || payload?.status === 0 || !user) {
    return (
      <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Profil introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Ce badge ne correspond à aucun profil public.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeStructure = (user.assign_structures || []).find((s: any) => s.is_active)?.structure?.libelle
  const activeStatut = (user.assign_statuts || []).find((s: any) => s.is_active)?.statut?.libelle
  const statutLabel = activeStatut ? 'Statut actif' : 'Rôle'
  const statutValue = activeStatut || roleLabel(user.role)
  const verified = !!user.is_active && !!user.is_approved

  return (
    <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
      <Card className="w-full max-w-xl overflow-hidden">
        <div className={`h-2 ${verified ? 'bg-success' : 'bg-warning'}`} />
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
            <AvatarFallback className="bg-primary text-white font-heading">
              {initials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate">{user.full_name}</CardTitle>
            <p className="text-sm text-gray-600">
              Code: <span className="font-semibold text-gray-900">{user.code || code}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-600">Statut de vérification</p>
            <p className={`mt-1 font-semibold ${verified ? 'text-success' : 'text-warning'}`}>
              {verified ? 'Profil authentique (actif & approuvé)' : 'Profil non vérifié'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Rôle</p>
              <p className="mt-1 font-semibold text-gray-900">{roleLabel(user.role)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Structure active</p>
              <p className="mt-1 font-semibold text-gray-900">{activeStructure || '-'}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">{statutLabel}</p>
              <p className="mt-1 font-semibold text-gray-900">{statutValue || '-'}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Contact</p>
              <p className="mt-1 font-semibold text-gray-900">{user.telephone || '-'}</p>
              <p className="text-sm text-gray-700">{user.email || '-'}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Cette page est publique et sert uniquement à vérifier l’authenticité du badge.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
