import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'react-qr-code'

import { usersApi } from '@/services/api/users'
import { useAuthStore } from '@/store/useAuthStore'
import { canAccessBadges } from '@/lib/access'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/types/user'

type BadgeUser = User

function initials(name: string | undefined) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function roleLabel(role: string | undefined) {
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

function getPublicProfileUrl(code: string) {
  const origin = window.location.origin
  return `${origin}/public/users/${encodeURIComponent(code)}`
}

function BadgeFace({ user }: { user: BadgeUser }) {
  const url = user.code ? getPublicProfileUrl(user.code) : ''
  const activeStructure = (user.assign_structures || []).find((s) => s.is_active)?.structure?.libelle
  const activeStatut = (user.assign_statuts || []).find((s) => s.is_active)?.statut?.libelle
  const statutLabel = activeStatut ? 'Statut' : 'Rôle'
  const statutValue = activeStatut || roleLabel(user.role)

  return (
    <div className="badge-card badge-front rounded-xl overflow-hidden border bg-white">
      <div className="badge-inner h-full w-full flex flex-col">
        <div className="flex-1 bg-white px-4 pt-4 pb-3 flex flex-col items-center justify-center text-center">
          <Avatar className="h-20 w-20 border-4 border-white shadow-md">
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
            <AvatarFallback className="bg-primary text-white font-heading">
              {initials(user.full_name)}
            </AvatarFallback>
          </Avatar>

          <p className="mt-2 font-heading font-bold text-darkslate leading-tight">
            {user.full_name}
          </p>
          <p className="text-xs text-gray-600 mt-1">{activeStructure || 'SNAESURS'}</p>
        </div>

        <div className="badge-band relative h-10 bg-primary flex items-center justify-center">
          <div className="badge-ribbon absolute left-1/2 -translate-x-1/2 -top-4 bg-darkslate text-white px-4 py-2 rounded-md shadow-md">
            <p className="text-[10px] leading-none opacity-80">CODE</p>
            <p className="font-heading text-sm font-bold leading-none">{user.code || '-'}</p>
          </div>
        </div>

        <div className="badge-after-band flex-1 min-h-0 bg-primary-hover flex flex-col items-center justify-center px-4 pb-4 pt-6">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            {url ? <QRCode value={url} size={88} /> : <div className="w-[88px] h-[88px] bg-gray-100" />}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 w-full text-center">
            <div>
              <p className="text-xs text-white/80">{statutLabel}</p>
              <p className="text-sm font-semibold text-white">{statutValue}</p>
            </div>
            <div>
              <p className="text-xs text-white/80">Téléphone</p>
              <p className="text-sm font-semibold text-white">{user.telephone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BadgeBack({ user }: { user: BadgeUser }) {
  const verified = !!user.is_active && !!user.is_approved
  const activeStructure = (user.assign_structures || []).find((s) => s.is_active)?.structure?.libelle
  const activeStatut = (user.assign_statuts || []).find((s) => s.is_active)?.statut?.libelle
  const statutLabel = activeStatut ? 'Statut' : 'Rôle'
  const statutValue = activeStatut || roleLabel(user.role)

  return (
    <div className="badge-card badge-back rounded-xl overflow-hidden border bg-white">
      <div className="badge-inner h-full w-full flex flex-col">
        <div className="flex-1 bg-primary-hover px-4 pt-4 pb-3 flex flex-col items-center justify-center text-center text-white">
          <div className="h-20 w-20 rounded-full bg-white/15 border-4 border-white flex items-center justify-center shadow-md">
            <img src="/images/logo.png" alt="SNAESURS" className="h-12 w-12 rounded-full object-cover bg-white/10" />
          </div>
          <p className="mt-2 font-heading font-bold leading-tight">SNAESURS</p>
          <p className="text-xs text-white/80">Badge d’authentification</p>
        </div>

        <div className="badge-band relative h-10 bg-primary flex items-center justify-center">
          <div className="badge-ribbon absolute left-1/2 -translate-x-1/2 -top-4 bg-darkslate text-white px-4 py-2 rounded-md shadow-md max-w-[90%]">
            <p className="font-heading text-sm font-bold leading-none truncate">{user.full_name}</p>
            <p className="text-[10px] leading-none opacity-80 mt-1">
              {verified ? 'Actif & approuvé' : 'Non vérifié'}
            </p>
          </div>
        </div>

        <div className="badge-after-band flex-1 min-h-0 bg-white px-4 pt-6 pb-4 flex flex-col items-center justify-center text-center">
          <div className="w-full">
            <div className="py-2 border-t border-gray-200">
              <p className="text-[10px] text-gray-500 tracking-wider">TÉLÉPHONE</p>
              <p className="text-sm font-semibold text-gray-900">{user.telephone || '-'}</p>
            </div>
            <div className="py-2 border-t border-gray-200">
              <p className="text-[10px] text-gray-500 tracking-wider">{statutLabel.toUpperCase()}</p>
              <p className="text-sm font-semibold text-gray-900">{statutValue || '-'}</p>
            </div>
            <div className="py-2 border-t border-gray-200">
              <p className="text-[10px] text-gray-500 tracking-wider">STRUCTURE</p>
              <p className="text-sm font-semibold text-gray-900">{activeStructure || '-'}</p>
            </div>
            <div className="py-2 border-t border-gray-200 border-b">
              <p className="text-[10px] text-gray-500 tracking-wider">CODE</p>
              <p className="text-sm font-semibold text-gray-900">{user.code || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BadgesPage() {
  const authUser = useAuthStore((state) => state.user)
  const canAccess = canAccessBadges(authUser)
  const [search, setSearch] = useState('')
  const [selectedCodes, setSelectedCodes] = useState<Record<string, boolean>>({})

  const badgeUsersQuery = useQuery({
    queryKey: ['badge-users', { search }],
    queryFn: async () => {
      const response = await usersApi.getBadgeUsers({ search, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: canAccess,
  })

  const users = (badgeUsersQuery.data || []) as BadgeUser[]

  const selectableUsers = useMemo(() => users.filter((u) => !!u.code), [users])

  const selected = useMemo(
    () => selectableUsers.filter((u) => u.code && selectedCodes[u.code]),
    [selectableUsers, selectedCodes]
  )

  if (!canAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accès limité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Seuls super_admin, admin et membre avec statut actif peuvent accéder aux badges.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const toggleAll = (value: boolean) => {
    const next: Record<string, boolean> = {}
    selectableUsers.forEach((u) => {
      if (u.code) next[u.code] = value
    })
    setSelectedCodes(next)
  }

  const toggleOne = (code: string) => {
    setSelectedCodes((prev) => ({ ...prev, [code]: !prev[code] }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-darkslate mb-2">Badges</h1>
          <p className="text-gray-600">Générez des badges prêts à imprimer</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toggleAll(true)} disabled={selectableUsers.length === 0}>
            Tout sélectionner
          </Button>
          <Button variant="outline" onClick={() => toggleAll(false)} disabled={selectableUsers.length === 0}>
            Tout désélectionner
          </Button>
          <Button onClick={() => window.print()} disabled={selected.length === 0}>
            Imprimer ({selected.length})
          </Button>
        </div>
      </div>

      <Card className="no-print">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Utilisateurs prêts</CardTitle>
            <Input
              type="search"
              placeholder="Rechercher (nom, téléphone, email, code)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-96"
            />
          </div>
        </CardHeader>
        <CardContent>
          {badgeUsersQuery.isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-primary">
                  <tr className="border-b border-primary/30">
                    <th className="h-12 px-4 text-left align-middle font-heading font-semibold text-white w-12">✓</th>
                    <th className="h-12 px-4 text-left align-middle font-heading font-semibold text-white">Nom</th>
                    <th className="h-12 px-4 text-left align-middle font-heading font-semibold text-white">Structure active</th>
                    <th className="h-12 px-4 text-left align-middle font-heading font-semibold text-white">Code</th>
                    <th className="h-12 px-4 text-left align-middle font-heading font-semibold text-white">Téléphone</th>
                  </tr>
                </thead>
                <tbody>
                  {selectableUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 align-middle">
                        <input
                          type="checkbox"
                          checked={!!(u.code && selectedCodes[u.code])}
                          onChange={() => u.code && toggleOne(u.code)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={u.avatar_url} alt={u.full_name} />
                            <AvatarFallback className="bg-primary text-white font-heading">
                              {initials(u.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{u.full_name}</p>
                            <p className="text-xs text-gray-500">{u.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-gray-700">
                        {(u.assign_structures || []).find((s) => s.is_active)?.structure?.libelle || '-'}
                      </td>
                      <td className="p-4 align-middle font-semibold text-gray-900">{u.code}</td>
                      <td className="p-4 align-middle text-gray-700">{u.telephone}</td>
                    </tr>
                  ))}
                  {selectableUsers.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={5}>
                        Aucun utilisateur prêt à imprimer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="print-area grid gap-6">
        {selected.map((u) => (
          <div key={u.code} className="badge-sheet grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center">
            <BadgeFace user={u} />
            <BadgeBack user={u} />
          </div>
        ))}
      </div>
    </div>
  )
}
