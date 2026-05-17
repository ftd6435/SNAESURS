import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Filter,
  UserPlus,
  Eye,
} from 'lucide-react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import DataTable from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import RoleBadge from '@/components/shared/RoleBadge'
import EmptyState from '@/components/shared/EmptyState'
import { usersApi, structuresApi, statutsApi } from '@/services/api/users'
import { toast } from '@/components/ui/sonner'
import type { User } from '@/types/user'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { canManageUsers, canToggleUserActive, canViewUsers, getActiveStructureIds } from '@/lib/access'

export default function UsersListPage() {
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewUser, setViewUser] = useState<User | null>(null)
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [createFullName, setCreateFullName] = useState('')
  const [createTelephone, setCreateTelephone] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createCode, setCreateCode] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createPasswordConfirmation, setCreatePasswordConfirmation] = useState('')
  const [createRole, setCreateRole] = useState<'admin' | 'membre'>('membre')
  const [createStructureId, setCreateStructureId] = useState<number | undefined>(undefined)
  const [createAssignedAt, setCreateAssignedAt] = useState('')
  const [createFraisIntegration, setCreateFraisIntegration] = useState('')
  const [createStatutId, setCreateStatutId] = useState<number | undefined>(undefined)
  const [createDateDebut, setCreateDateDebut] = useState('')
  const [createDateFin, setCreateDateFin] = useState('')
  const [createIsApproved, setCreateIsApproved] = useState(false)
  const [createIsActive, setCreateIsActive] = useState(true)
  const [createAvatar, setCreateAvatar] = useState<File | null>(null)
  const queryClient = useQueryClient()
  const authUser = useAuthStore((state) => state.user)
  const canView = canViewUsers(authUser)
  const canManage = canManageUsers(authUser)
  const canToggleActive = canToggleUserActive(authUser)
  const activeStructureIds = getActiveStructureIds(authUser)
  const structureId = authUser?.role === 'membre' ? activeStructureIds[0] : undefined
  const activeStructureLabel = authUser?.role === 'membre'
    ? (authUser?.assign_structures ?? []).find((s) => s.is_active)?.structure?.libelle
    : undefined

  useEffect(() => {
    if (!isCreateOpen) return
    if (authUser?.role !== 'membre') return
    if (!structureId) return
    if (createStructureId) return
    setCreateStructureId(structureId)
  }, [authUser?.role, createStructureId, isCreateOpen, structureId])

  if (!canView) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accès limité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              La consultation des membres nécessite un statut actif.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const usersQuery = useQuery({
    queryKey: ['users', { search, structure_id: structureId }],
    queryFn: async () => {
      const response = await usersApi.getUsers({ search, structure_id: structureId, per_page: 20 })
      return response.data.data?.data || []
    },
  })

  const structuresQuery = useQuery({
    queryKey: ['structures', { for: 'users-create' }],
    queryFn: async () => {
      const response = await structuresApi.getStructures({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: canManage && authUser?.role !== 'membre',
  })

  const statutsQuery = useQuery({
    queryKey: ['statuts', { for: 'users-create' }],
    queryFn: async () => {
      const response = await statutsApi.getStatuts({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: canManage && authUser?.role !== 'membre',
  })

  const closeCreate = () => {
    setIsCreateOpen(false)
    setCreateErrors({})
    setCreateFullName('')
    setCreateTelephone('')
    setCreateEmail('')
    setCreateCode('')
    setCreatePassword('')
    setCreatePasswordConfirmation('')
    setCreateRole('membre')
    setCreateStructureId(undefined)
    setCreateAssignedAt('')
    setCreateFraisIntegration('')
    setCreateStatutId(undefined)
    setCreateDateDebut('')
    setCreateDateFin('')
    setCreateIsApproved(false)
    setCreateIsActive(true)
    setCreateAvatar(null)
  }

  const openCreate = () => {
    if (authUser?.role === 'membre') {
      setCreateRole('membre')
      setCreateStructureId(structureId)
      setCreateIsApproved(false)
    }
    setIsCreateOpen(true)
  }

  const closeView = () => {
    setIsViewOpen(false)
    setViewUser(null)
  }

  const openView = (user: User) => {
    setViewUser(user)
    setIsViewOpen(true)
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('full_name', createFullName)
      formData.append('telephone', createTelephone)
      if (createEmail) formData.append('email', createEmail)
      if (createCode) formData.append('code', createCode)
      formData.append('password', createPassword)
      formData.append('password_confirmation', createPasswordConfirmation)
      formData.append('role', createRole)
      formData.append('is_approved', createIsApproved ? '1' : '0')
      formData.append('is_active', createIsActive ? '1' : '0')

      const finalStructureId = authUser?.role === 'membre' ? (createStructureId ?? structureId) : createStructureId
      if (finalStructureId) formData.append('structure_id', String(finalStructureId))
      if (createAssignedAt) formData.append('assigned_at', createAssignedAt)
      if (createFraisIntegration) formData.append('frais_integration', createFraisIntegration)

      if (createStatutId) formData.append('statut_id', String(createStatutId))
      if (createDateDebut) formData.append('date_debut', createDateDebut)
      if (createDateFin) formData.append('date_fin', createDateFin)

      if (createAvatar) formData.append('avatar', createAvatar)

      return usersApi.createUser(formData)
    },
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success(result.message || 'Utilisateur créé avec succès')
        closeCreate()
        queryClient.invalidateQueries({ queryKey: ['users'] })
      } else {
        toast.error(result.message || 'Erreur lors de la création')
      }
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const payload = error.response?.data as any
        const validationErrors = payload?.errors || payload?.error
        if (validationErrors && typeof validationErrors === 'object') {
          const next: Record<string, string> = {}
          Object.entries(validationErrors).forEach(([field, messages]) => {
            next[field] = Array.isArray(messages) ? String(messages[0]) : String(messages)
          })
          setCreateErrors(next)
          toast.error(payload?.message || 'Veuillez corriger les erreurs.')
          return
        }
        toast.error(payload?.message || 'Une erreur est survenue')
        return
      }
      toast.error('Une erreur est survenue')
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => usersApi.approveUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utilisateur approuvé avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de l\'approbation')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => usersApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Statut mis à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const users = usersQuery.data || []

  const renderUserActiveBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {isActive ? 'Actif' : 'Inactif'}
    </span>
  )

  const columns = [
    {
      key: 'user',
      header: 'Utilisateur',
      cell: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
            <AvatarFallback className="bg-primary text-white font-heading">
              {user.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{user.full_name}</p>
            <p className="text-sm text-gray-500">{user.email || user.telephone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      cell: (user: User) => <RoleBadge role={user.role} />,
    },
    {
      key: 'is_approved',
      header: 'Approbation',
      cell: (user: User) => (
        <StatusBadge status={user.is_approved ? 'approved' : 'pending'} />
      ),
    },
    {
      key: 'is_active',
      header: 'Statut',
      cell: (user: User) => renderUserActiveBadge(!!user.is_active),
    },
    {
      key: 'created_at',
      header: 'Date création',
      cell: (user: User) => formatDate(user.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openView(user)}
            title="Voir les détails"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </Button>
          {canManage && (
            <>
              {!user.is_approved && user.role === 'membre' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => approveMutation.mutate(user.id)}
                  disabled={approveMutation.isPending}
                  title="Approuver"
                >
                  <span className="text-success">✓</span>
                </Button>
              )}
              {canToggleActive && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleActiveMutation.mutate(user.id)}
                  disabled={toggleActiveMutation.isPending}
                  title={user.is_active ? 'Désactiver' : 'Activer'}
                >
                  <span className={cn(user.is_active ? 'text-warning' : 'text-gray-400')}>
                    ⏻
                  </span>
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-2xl max-h-[85vh] rounded-lg bg-white shadow-lg flex flex-col overflow-hidden"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Ajouter un membre</h2>
                <Button variant="ghost" size="icon" onClick={closeCreate}>
                  ✕
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Nom complet *</label>
                  <Input value={createFullName} onChange={(e) => setCreateFullName(e.target.value)} />
                  {createErrors.full_name && <p className="text-sm text-red-500">{createErrors.full_name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Téléphone *</label>
                  <Input value={createTelephone} onChange={(e) => setCreateTelephone(e.target.value)} />
                  {createErrors.telephone && <p className="text-sm text-red-500">{createErrors.telephone}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
                  {createErrors.email && <p className="text-sm text-red-500">{createErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Code (6 chiffres)</label>
                  <Input
                    inputMode="numeric"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  {createErrors.code && <p className="text-sm text-red-500">{createErrors.code}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mot de passe *</label>
                  <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
                  {createErrors.password && <p className="text-sm text-red-500">{createErrors.password}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmation *</label>
                  <Input type="password" value={createPasswordConfirmation} onChange={(e) => setCreatePasswordConfirmation(e.target.value)} />
                  {createErrors.password_confirmation && <p className="text-sm text-red-500">{createErrors.password_confirmation}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rôle</label>
                  {authUser?.role === 'membre' ? (
                    <Input value="membre" disabled />
                  ) : (
                    <select
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as any)}
                      className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    >
                      <option value="membre">Membre</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  {createErrors.role && <p className="text-sm text-red-500">{createErrors.role}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Structure *</label>
                  {authUser?.role === 'membre' ? (
                    <Input value={activeStructureLabel ? `${activeStructureLabel}` : String(createStructureId ?? structureId ?? '')} disabled />
                  ) : (
                    <select
                      value={createStructureId ?? ''}
                      onChange={(e) => setCreateStructureId(e.target.value ? Number(e.target.value) : undefined)}
                      className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    >
                      <option value="">Sélectionner...</option>
                      {(structuresQuery.data || []).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.libelle}</option>
                      ))}
                    </select>
                  )}
                  {createErrors.structure_id && <p className="text-sm text-red-500">{createErrors.structure_id}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date d'affectation</label>
                  <Input type="date" value={createAssignedAt} onChange={(e) => setCreateAssignedAt(e.target.value)} />
                  {createErrors.assigned_at && <p className="text-sm text-red-500">{createErrors.assigned_at}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Frais d'intégration</label>
                  <Input type="number" min={0} value={createFraisIntegration} onChange={(e) => setCreateFraisIntegration(e.target.value)} />
                  {createErrors.frais_integration && <p className="text-sm text-red-500">{createErrors.frais_integration}</p>}
                </div>

                {authUser?.role !== 'membre' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Statut (optionnel)</label>
                    <select
                      value={createStatutId ?? ''}
                      onChange={(e) => setCreateStatutId(e.target.value ? Number(e.target.value) : undefined)}
                      disabled={statutsQuery.isLoading || (statutsQuery.data || []).length === 0}
                      className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2 disabled:opacity-60"
                    >
                      <option value="">
                        {statutsQuery.isLoading
                          ? 'Chargement...'
                          : (statutsQuery.data || []).length === 0
                            ? 'Aucun statut disponible'
                            : 'Aucun'}
                      </option>
                      {(statutsQuery.data || []).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.libelle}</option>
                      ))}
                    </select>
                    {createErrors.statut_id && <p className="text-sm text-red-500">{createErrors.statut_id}</p>}
                  </div>
                )}

                {authUser?.role !== 'membre' && !!createStatutId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date début</label>
                    <Input type="date" value={createDateDebut} onChange={(e) => setCreateDateDebut(e.target.value)} />
                    {createErrors.date_debut && <p className="text-sm text-red-500">{createErrors.date_debut}</p>}
                  </div>
                )}

                {authUser?.role !== 'membre' && !!createStatutId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date fin</label>
                    <Input type="date" value={createDateFin} onChange={(e) => setCreateDateFin(e.target.value)} />
                    {createErrors.date_fin && <p className="text-sm text-red-500">{createErrors.date_fin}</p>}
                  </div>
                )}

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Avatar</label>
                  <Input type="file" accept="image/*" onChange={(e) => setCreateAvatar(e.target.files?.[0] || null)} />
                  {createErrors.avatar && <p className="text-sm text-red-500">{createErrors.avatar}</p>}
                </div>

                <div className="flex items-center gap-4 sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={createIsActive} onChange={(e) => setCreateIsActive(e.target.checked)} className="rounded border-gray-300" />
                    Actif
                  </label>
                  {authUser?.role !== 'membre' && (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={createIsApproved} onChange={(e) => setCreateIsApproved(e.target.checked)} className="rounded border-gray-300" />
                      Approuvé
                    </label>
                  )}
                </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-white flex justify-end gap-2">
                <Button variant="outline" onClick={closeCreate}>Annuler</Button>
                <Button
                  onClick={() => {
                    setCreateErrors({})
                    if (!createFullName.trim()) {
                      setCreateErrors((p) => ({ ...p, full_name: 'Le nom complet est obligatoire.' }))
                      return
                    }
                    if (!createTelephone.trim()) {
                      setCreateErrors((p) => ({ ...p, telephone: 'Le numéro de téléphone est obligatoire.' }))
                      return
                    }
                    if (createCode && !/^\d{6}$/.test(createCode)) {
                      setCreateErrors((p) => ({ ...p, code: 'Le code doit contenir exactement 6 chiffres.' }))
                      return
                    }
                    if (!createPassword) {
                      setCreateErrors((p) => ({ ...p, password: 'Le mot de passe est obligatoire.' }))
                      return
                    }
                    if (createPassword !== createPasswordConfirmation) {
                      setCreateErrors((p) => ({ ...p, password_confirmation: 'La confirmation ne correspond pas.' }))
                      return
                    }
                    if (authUser?.role === 'membre' && structureId && !createStructureId) {
                      setCreateStructureId(structureId)
                    }
                    if (!(createStructureId ?? (authUser?.role === 'membre' ? structureId : undefined))) {
                      setCreateErrors((p) => ({ ...p, structure_id: 'La structure est obligatoire.' }))
                      return
                    }
                    createMutation.mutate()
                  }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isViewOpen && viewUser && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-3xl max-h-[85vh] rounded-lg bg-white shadow-lg flex flex-col overflow-hidden"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Détails du membre</h2>
                  <p className="text-sm text-gray-500">{viewUser.full_name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={closeView}>
                  ✕
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={viewUser.avatar_url} alt={viewUser.full_name} />
                    <AvatarFallback className="bg-primary text-white font-heading">
                      {viewUser.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <RoleBadge role={viewUser.role} />
                      <StatusBadge status={viewUser.is_active} />
                      <StatusBadge status={viewUser.is_approved ? 'approved' : 'pending'} />
                    </div>
                    <div className="mt-2 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><span className="text-gray-500">Code:</span> {viewUser.code || '-'}</div>
                      <div><span className="text-gray-500">Téléphone:</span> {viewUser.telephone}</div>
                      <div><span className="text-gray-500">Email:</span> {viewUser.email || '-'}</div>
                      <div><span className="text-gray-500">Genre:</span> {viewUser.genre || '-'}</div>
                      <div><span className="text-gray-500">Date naissance:</span> {viewUser.date_naissance || '-'}</div>
                      <div className="sm:col-span-2"><span className="text-gray-500">Adresse:</span> {viewUser.adresse || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium text-gray-900">Personne à contacter</p>
                    <p className="mt-2 text-sm text-gray-700">{viewUser.person_a_contacter || '-'}</p>
                    <p className="text-sm text-gray-700">{viewUser.phone_person_a_contacter || '-'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium text-gray-900">Dates</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                      <div><span className="text-gray-500">Créé:</span> {formatDate(viewUser.created_at)}</div>
                      <div><span className="text-gray-500">Mis à jour:</span> {formatDate(viewUser.updated_at)}</div>
                      <div><span className="text-gray-500">Approuvé:</span> {viewUser.approved_at || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-gray-900">Affectations de structures</p>
                  <div className="mt-3 space-y-2">
                    {(viewUser.assign_structures || []).length ? (
                      (viewUser.assign_structures || []).map((a) => (
                        <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                          <div className="text-sm text-gray-800">
                            <span className="font-medium">{a.structure?.libelle || `Structure #${a.structure_id}`}</span>
                            <span className="text-gray-500"> · {a.assigned_at ? formatDate(a.assigned_at) : '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={a.is_active} />
                            <span className="text-sm text-gray-700">{formatCurrency(a.frais_integration || 0)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Aucune affectation</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-gray-900">Affectations de statuts</p>
                  <div className="mt-3 space-y-2">
                    {(viewUser.assign_statuts || []).length ? (
                      (viewUser.assign_statuts || []).map((a) => (
                        <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                          <div className="text-sm text-gray-800">
                            <span className="font-medium">{a.statut?.libelle || `Statut #${a.statut_id}`}</span>
                            <span className="text-gray-500"> · {a.date_debut ? formatDate(a.date_debut) : '-'} → {a.date_fin ? formatDate(a.date_fin) : '-'}</span>
                          </div>
                          <StatusBadge status={a.is_active} />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Aucun statut</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-white flex justify-end gap-2">
                <Button variant="outline" onClick={closeView}>Fermer</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-darkslate mb-2">Membres</h1>
          <p className="text-gray-600">Gérez les membres du syndicat</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <UserPlus className="w-4 h-4 mr-2" />
            Ajouter un membre
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Tous les membres</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersQuery.error ? (
            <EmptyState
              title="Erreur de chargement"
              description="Impossible de charger la liste des membres"
            />
          ) : (
            <DataTable
              columns={columns}
              data={users}
              loading={usersQuery.isLoading}
              emptyMessage="Aucun membre trouvé"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
