import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building, Users, Plus, Search, Pencil, Trash2, Power, Eye } from 'lucide-react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import DataTable from '@/components/shared/DataTable'
import { assignStructuresApi, assignStatutsApi, statutsApi, structuresApi, usersApi } from '@/services/api/users'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { canManageSettings } from '@/lib/access'
import { toast } from '@/components/ui/sonner'

type ActiveTab = 'assign_structures' | 'assign_statuts'

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('assign_structures')
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [assignStructureUserId, setAssignStructureUserId] = useState<number | undefined>(undefined)
  const [assignStructureId, setAssignStructureId] = useState<number | undefined>(undefined)
  const [assignAssignedAt, setAssignAssignedAt] = useState('')
  const [assignFraisIntegration, setAssignFraisIntegration] = useState('')
  const [assignStructureRemarks, setAssignStructureRemarks] = useState('')
  const [assignStructureIsActive, setAssignStructureIsActive] = useState(true)
  const [assignStatutUserId, setAssignStatutUserId] = useState<number | undefined>(undefined)
  const [assignStatutId, setAssignStatutId] = useState<number | undefined>(undefined)
  const [assignDateDebut, setAssignDateDebut] = useState('')
  const [assignDateFin, setAssignDateFin] = useState('')
  const [assignStatutRemarks, setAssignStatutRemarks] = useState('')
  const [assignStatutIsActive, setAssignStatutIsActive] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTab, setEditTab] = useState<ActiveTab | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ tab: ActiveTab; id: number; label: string } | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsTab, setDetailsTab] = useState<ActiveTab | null>(null)
  const [detailsItem, setDetailsItem] = useState<any | null>(null)

  const user = useAuthStore((state) => state.user)
  const canManage = canManageSettings(user)
  const queryClient = useQueryClient()

  if (!canManage) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accès limité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              La gestion des affectations nécessite un statut actif et des droits administrateur.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const usersQuery = useQuery({
    queryKey: ['users', { for: 'settings-assignments', search }],
    queryFn: async () => {
      const response = await usersApi.getUsers({ search, per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const structuresQuery = useQuery({
    queryKey: ['structures', { for: 'settings-assignments' }],
    queryFn: async () => {
      const response = await structuresApi.getStructures({ per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const statutsQuery = useQuery({
    queryKey: ['statuts', { for: 'settings-assignments' }],
    queryFn: async () => {
      const response = await statutsApi.getStatuts({ per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const assignStructuresQuery = useQuery({
    queryKey: ['assign_structures', { search }],
    queryFn: async () => {
      const response = await assignStructuresApi.list({ per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const assignStatutsQuery = useQuery({
    queryKey: ['assign_statuts', { search }],
    queryFn: async () => {
      const response = await assignStatutsApi.list({ per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const renderIsActiveBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {isActive ? 'Actif' : 'Inactif'}
    </span>
  )

  const closeCreate = () => {
    setIsCreateOpen(false)
    setCreateErrors({})
    setAssignStructureUserId(undefined)
    setAssignStructureId(undefined)
    setAssignAssignedAt('')
    setAssignFraisIntegration('')
    setAssignStructureRemarks('')
    setAssignStructureIsActive(true)
    setAssignStatutUserId(undefined)
    setAssignStatutId(undefined)
    setAssignDateDebut('')
    setAssignDateFin('')
    setAssignStatutRemarks('')
    setAssignStatutIsActive(true)
  }

  const openEdit = (tab: ActiveTab, item: any) => {
    setEditErrors({})
    setEditTab(tab)
    setEditId(item.id)
    setIsCreateOpen(false)

    if (tab === 'assign_structures') {
      setAssignStructureUserId(item.user?.id || item.user_id)
      setAssignStructureId(item.structure?.id || item.structure_id)
      setAssignAssignedAt(item.assigned_at || '')
      setAssignFraisIntegration(item.frais_integration !== null && item.frais_integration !== undefined ? String(item.frais_integration) : '')
      setAssignStructureRemarks(item.remarks || '')
      setAssignStructureIsActive(!!item.is_active)
    } else {
      setAssignStatutUserId(item.user?.id || item.user_id)
      setAssignStatutId(item.statut?.id || item.statut_id)
      setAssignDateDebut(item.date_debut || '')
      setAssignDateFin(item.date_fin || '')
      setAssignStatutRemarks(item.remarks || '')
      setAssignStatutIsActive(!!item.is_active)
    }

    setIsEditOpen(true)
  }

  const closeEdit = () => {
    setIsEditOpen(false)
    setEditTab(null)
    setEditId(null)
    setEditErrors({})
  }

  const openDetails = (tab: ActiveTab, item: any) => {
    setDetailsTab(tab)
    setDetailsItem(item)
    setIsDetailsOpen(true)
  }

  const closeDetails = () => {
    setIsDetailsOpen(false)
    setDetailsTab(null)
    setDetailsItem(null)
  }

  const openDelete = (tab: ActiveTab, item: any) => {
    const label =
      tab === 'assign_structures'
        ? `${item.user?.full_name || 'Utilisateur'} → ${item.structure?.libelle || 'Structure'}`
        : `${item.user?.full_name || 'Utilisateur'} → ${item.statut?.libelle || 'Statut'}`
    setDeleteTarget({ tab, id: item.id, label })
    setIsDeleteOpen(true)
  }

  const closeDelete = () => {
    setIsDeleteOpen(false)
    setDeleteTarget(null)
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (activeTab === 'assign_structures') {
        return assignStructuresApi.create({
          structure_id: assignStructureId!,
          user_id: assignStructureUserId!,
          assigned_at: assignAssignedAt || undefined,
          frais_integration: assignFraisIntegration ? Number(assignFraisIntegration) : undefined,
          remarks: assignStructureRemarks || undefined,
          is_active: assignStructureIsActive,
        })
      }

      return assignStatutsApi.create({
        user_id: assignStatutUserId!,
        statut_id: assignStatutId!,
        date_debut: assignDateDebut || undefined,
        date_fin: assignDateFin,
        remarks: assignStatutRemarks || undefined,
        is_active: assignStatutIsActive,
      })
    },
    onSuccess: (response) => {
      const result = response.data
      if (result?.status === 1) {
        toast.success(result.message || 'Création réussie')
        closeCreate()
        queryClient.invalidateQueries({ queryKey: ['assign_structures'] })
        queryClient.invalidateQueries({ queryKey: ['assign_statuts'] })
      } else {
        toast.error(result?.message || 'Erreur lors de la création')
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

  const toggleActiveMutation = useMutation({
    mutationFn: (payload: { tab: ActiveTab; id: number; next: boolean }) => {
      if (payload.tab === 'assign_structures') return assignStructuresApi.update(payload.id, { is_active: payload.next })
      return assignStatutsApi.update(payload.id, { is_active: payload.next })
    },
    onSuccess: (response) => {
      const result = response.data
      if (result?.status === 1) {
        queryClient.invalidateQueries({ queryKey: ['assign_structures'] })
        queryClient.invalidateQueries({ queryKey: ['assign_statuts'] })
        toast.success('Statut mis à jour')
      } else {
        toast.error(result?.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editTab || !editId) throw new Error('Missing edit target')

      if (editTab === 'assign_structures') {
        return assignStructuresApi.update(editId, {
          assigned_at: assignAssignedAt || undefined,
          frais_integration: assignFraisIntegration ? Number(assignFraisIntegration) : undefined,
          remarks: assignStructureRemarks || undefined,
          is_active: assignStructureIsActive,
        })
      }

      return assignStatutsApi.update(editId, {
        date_debut: assignDateDebut || undefined,
        date_fin: assignDateFin,
        remarks: assignStatutRemarks || undefined,
        is_active: assignStatutIsActive,
      })
    },
    onSuccess: (response) => {
      const result = response.data
      if (result?.status === 1) {
        queryClient.invalidateQueries({ queryKey: ['assign_structures'] })
        queryClient.invalidateQueries({ queryKey: ['assign_statuts'] })
        toast.success(result.message || 'Mise à jour effectuée')
        closeEdit()
      } else {
        toast.error(result?.message || 'Erreur lors de la mise à jour')
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
          setEditErrors(next)
          toast.error(payload?.message || 'Veuillez corriger les erreurs.')
          return
        }
        toast.error(payload?.message || 'Une erreur est survenue')
        return
      }
      toast.error('Une erreur est survenue')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) throw new Error('Missing delete target')
      if (deleteTarget.tab === 'assign_structures') return assignStructuresApi.delete(deleteTarget.id)
      return assignStatutsApi.delete(deleteTarget.id)
    },
    onSuccess: (response) => {
      const result = response.data
      if (result?.status === 1) {
        queryClient.invalidateQueries({ queryKey: ['assign_structures'] })
        queryClient.invalidateQueries({ queryKey: ['assign_statuts'] })
        toast.success(result.message || 'Suppression effectuée')
        closeDelete()
      } else {
        toast.error(result?.message || 'Erreur lors de la suppression')
      }
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const assignStructureColumns = [
    {
      key: 'user',
      header: 'Utilisateur',
      cell: (item: any) => (
        <div>
          <p className="font-medium text-gray-900">{item.user?.full_name || '-'}</p>
          <p className="text-sm text-gray-500">{item.user?.email || item.user?.telephone || ''}</p>
        </div>
      ),
    },
    {
      key: 'structure',
      header: 'Structure',
      cell: (item: any) => <span className="text-sm">{item.structure?.libelle || '-'}</span>,
    },
    {
      key: 'assigned_at',
      header: 'Affecté le',
      cell: (item: any) => <span className="text-sm">{item.assigned_at ? formatDate(item.assigned_at) : '-'}</span>,
    },
    {
      key: 'is_active',
      header: 'Actif',
      cell: (item: any) => renderIsActiveBadge(!!item.is_active),
    },
    {
      key: 'frais_integration',
      header: 'Frais',
      cell: (item: any) => <span className="text-sm">{formatCurrency(item.frais_integration || 0)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="Détails" onClick={() => openDetails('assign_structures', item)}>
            <Eye className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={item.is_active ? 'Désactiver' : 'Activer'}
            onClick={() => toggleActiveMutation.mutate({ tab: 'assign_structures', id: item.id, next: !item.is_active })}
            disabled={toggleActiveMutation.isPending}
          >
            <Power className={`w-4 h-4 ${item.is_active ? 'text-warning' : 'text-gray-400'}`} />
          </Button>
          <Button variant="ghost" size="icon" title="Modifier" onClick={() => openEdit('assign_structures', item)}>
            <Pencil className="w-4 h-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Supprimer" onClick={() => openDelete('assign_structures', item)}>
            <Trash2 className="w-4 h-4 text-error" />
          </Button>
        </div>
      ),
    },
  ]

  const assignStatutColumns = [
    {
      key: 'user',
      header: 'Utilisateur',
      cell: (item: any) => (
        <div>
          <p className="font-medium text-gray-900">{item.user?.full_name || '-'}</p>
          <p className="text-sm text-gray-500">{item.user?.email || item.user?.telephone || ''}</p>
        </div>
      ),
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (item: any) => <span className="text-sm">{item.statut?.libelle || '-'}</span>,
    },
    {
      key: 'date_debut',
      header: 'Début',
      cell: (item: any) => <span className="text-sm">{item.date_debut ? formatDate(item.date_debut) : '-'}</span>,
    },
    {
      key: 'date_fin',
      header: 'Fin',
      cell: (item: any) => <span className="text-sm">{item.date_fin ? formatDate(item.date_fin) : '-'}</span>,
    },
    {
      key: 'is_active',
      header: 'Actif',
      cell: (item: any) => renderIsActiveBadge(!!item.is_active),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="Détails" onClick={() => openDetails('assign_statuts', item)}>
            <Eye className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={item.is_active ? 'Désactiver' : 'Activer'}
            onClick={() => toggleActiveMutation.mutate({ tab: 'assign_statuts', id: item.id, next: !item.is_active })}
            disabled={toggleActiveMutation.isPending}
          >
            <Power className={`w-4 h-4 ${item.is_active ? 'text-warning' : 'text-gray-400'}`} />
          </Button>
          <Button variant="ghost" size="icon" title="Modifier" onClick={() => openEdit('assign_statuts', item)}>
            <Pencil className="w-4 h-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Supprimer" onClick={() => openDelete('assign_statuts', item)}>
            <Trash2 className="w-4 h-4 text-error" />
          </Button>
        </div>
      ),
    },
  ]

  const currentTab = activeTab === 'assign_structures'
    ? {
        title: 'Affectations de structures',
        addLabel: 'Affecter à une structure',
        data: assignStructuresQuery.data || [],
        columns: assignStructureColumns,
        loading: assignStructuresQuery.isLoading,
        emptyMessage: 'Aucune affectation de structure trouvée',
      }
    : {
        title: 'Affectations de statuts',
        addLabel: 'Affecter un statut',
        data: assignStatutsQuery.data || [],
        columns: assignStatutColumns,
        loading: assignStatutsQuery.isLoading,
        emptyMessage: 'Aucune affectation de statut trouvée',
      }

  const joiningFeesTotal = (assignStructuresQuery.data || []).reduce((sum: number, item: any) => {
    const value = typeof item?.frais_integration === 'number' ? item.frais_integration : Number(item?.frais_integration)
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)

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
              className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-r from-[#135796] to-[#0f3f6d] px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                        <Plus className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">{currentTab.addLabel}</h2>
                        <p className="mt-0.5 truncate text-sm text-white/80">
                          {activeTab === 'assign_structures' ? 'Affecter un utilisateur à une structure' : 'Affecter un statut à un utilisateur'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeCreate} className="text-white hover:bg-white/15 hover:text-white">✕</Button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {activeTab === 'assign_structures' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Utilisateur *</label>
                      <select
                        value={assignStructureUserId ?? ''}
                        onChange={(e) => setAssignStructureUserId(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      >
                        <option value="">{usersQuery.isLoading ? 'Chargement...' : 'Sélectionner...'}</option>
                        {(usersQuery.data || []).map((u: any) => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                      {createErrors.user_id && <p className="text-sm text-red-500">{createErrors.user_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Structure *</label>
                      <select
                        value={assignStructureId ?? ''}
                        onChange={(e) => setAssignStructureId(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      >
                        <option value="">{structuresQuery.isLoading ? 'Chargement...' : 'Sélectionner...'}</option>
                        {(structuresQuery.data || []).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.libelle}</option>
                        ))}
                      </select>
                      {createErrors.structure_id && <p className="text-sm text-red-500">{createErrors.structure_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date d'affectation</label>
                      <Input type="date" value={assignAssignedAt} onChange={(e) => setAssignAssignedAt(e.target.value)} />
                      {createErrors.assigned_at && <p className="text-sm text-red-500">{createErrors.assigned_at}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frais d'intégration</label>
                      <Input type="number" min={0} value={assignFraisIntegration} onChange={(e) => setAssignFraisIntegration(e.target.value)} />
                      {createErrors.frais_integration && <p className="text-sm text-red-500">{createErrors.frais_integration}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Remarques</label>
                      <textarea
                        value={assignStructureRemarks}
                        onChange={(e) => setAssignStructureRemarks(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      />
                      {createErrors.remarks && <p className="text-sm text-red-500">{createErrors.remarks}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignStructureIsActive}
                        onChange={(e) => setAssignStructureIsActive(e.target.checked)}
                        className="rounded border-gray-300"
                        id="assignStructureIsActive"
                      />
                      <label htmlFor="assignStructureIsActive" className="text-sm">Actif</label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Utilisateur *</label>
                      <select
                        value={assignStatutUserId ?? ''}
                        onChange={(e) => setAssignStatutUserId(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      >
                        <option value="">{usersQuery.isLoading ? 'Chargement...' : 'Sélectionner...'}</option>
                        {(usersQuery.data || []).map((u: any) => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                      {createErrors.user_id && <p className="text-sm text-red-500">{createErrors.user_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Statut *</label>
                      <select
                        value={assignStatutId ?? ''}
                        onChange={(e) => setAssignStatutId(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      >
                        <option value="">{statutsQuery.isLoading ? 'Chargement...' : 'Sélectionner...'}</option>
                        {(statutsQuery.data || []).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.libelle}</option>
                        ))}
                      </select>
                      {createErrors.statut_id && <p className="text-sm text-red-500">{createErrors.statut_id}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date début</label>
                        <Input type="date" value={assignDateDebut} onChange={(e) => setAssignDateDebut(e.target.value)} />
                        {createErrors.date_debut && <p className="text-sm text-red-500">{createErrors.date_debut}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date fin *</label>
                        <Input type="date" value={assignDateFin} onChange={(e) => setAssignDateFin(e.target.value)} />
                        {createErrors.date_fin && <p className="text-sm text-red-500">{createErrors.date_fin}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Remarques</label>
                      <textarea
                        value={assignStatutRemarks}
                        onChange={(e) => setAssignStatutRemarks(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      />
                      {createErrors.remarks && <p className="text-sm text-red-500">{createErrors.remarks}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignStatutIsActive}
                        onChange={(e) => setAssignStatutIsActive(e.target.checked)}
                        className="rounded border-gray-300"
                        id="assignStatutIsActive"
                      />
                      <label htmlFor="assignStatutIsActive" className="text-sm">Actif</label>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4">
                <Button variant="outline" onClick={closeCreate}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    setCreateErrors({})
                    if (activeTab === 'assign_structures') {
                      if (!assignStructureUserId) {
                        setCreateErrors((prev) => ({ ...prev, user_id: 'L\'utilisateur est obligatoire.' }))
                        return
                      }
                      if (!assignStructureId) {
                        setCreateErrors((prev) => ({ ...prev, structure_id: 'La structure est obligatoire.' }))
                        return
                      }
                    } else {
                      if (!assignStatutUserId) {
                        setCreateErrors((prev) => ({ ...prev, user_id: 'L\'utilisateur est obligatoire.' }))
                        return
                      }
                      if (!assignStatutId) {
                        setCreateErrors((prev) => ({ ...prev, statut_id: 'Le statut est obligatoire.' }))
                        return
                      }
                      if (!assignDateFin) {
                        setCreateErrors((prev) => ({ ...prev, date_fin: 'La date de fin est obligatoire.' }))
                        return
                      }
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

        {isEditOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-r from-[#135796] to-[#0f3f6d] px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                        <Pencil className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">Modifier</h2>
                        <p className="mt-0.5 truncate text-sm text-white/80">
                          {editTab === 'assign_structures' ? 'Mettre à jour une affectation de structure' : 'Mettre à jour une affectation de statut'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeEdit} className="text-white hover:bg-white/15 hover:text-white">✕</Button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {editTab === 'assign_structures' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Utilisateur</label>
                      <select
                        value={assignStructureUserId ?? ''}
                        disabled
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm"
                      >
                        {(usersQuery.data || []).map((u: any) => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Structure</label>
                      <select
                        value={assignStructureId ?? ''}
                        disabled
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm"
                      >
                        {(structuresQuery.data || []).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.libelle}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date d'affectation</label>
                      <Input type="date" value={assignAssignedAt} onChange={(e) => setAssignAssignedAt(e.target.value)} />
                      {editErrors.assigned_at && <p className="text-sm text-red-500">{editErrors.assigned_at}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frais d'intégration</label>
                      <Input type="number" min={0} value={assignFraisIntegration} onChange={(e) => setAssignFraisIntegration(e.target.value)} />
                      {editErrors.frais_integration && <p className="text-sm text-red-500">{editErrors.frais_integration}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Remarques</label>
                      <textarea
                        value={assignStructureRemarks}
                        onChange={(e) => setAssignStructureRemarks(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      />
                      {editErrors.remarks && <p className="text-sm text-red-500">{editErrors.remarks}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignStructureIsActive}
                        onChange={(e) => setAssignStructureIsActive(e.target.checked)}
                        className="rounded border-gray-300"
                        id="assignStructureIsActiveEdit"
                      />
                      <label htmlFor="assignStructureIsActiveEdit" className="text-sm">Actif</label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Utilisateur</label>
                      <select
                        value={assignStatutUserId ?? ''}
                        disabled
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm"
                      >
                        {(usersQuery.data || []).map((u: any) => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Statut</label>
                      <select
                        value={assignStatutId ?? ''}
                        disabled
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm"
                      >
                        {(statutsQuery.data || []).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.libelle}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date début</label>
                        <Input type="date" value={assignDateDebut} onChange={(e) => setAssignDateDebut(e.target.value)} />
                        {editErrors.date_debut && <p className="text-sm text-red-500">{editErrors.date_debut}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date fin *</label>
                        <Input type="date" value={assignDateFin} onChange={(e) => setAssignDateFin(e.target.value)} />
                        {editErrors.date_fin && <p className="text-sm text-red-500">{editErrors.date_fin}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Remarques</label>
                      <textarea
                        value={assignStatutRemarks}
                        onChange={(e) => setAssignStatutRemarks(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      />
                      {editErrors.remarks && <p className="text-sm text-red-500">{editErrors.remarks}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignStatutIsActive}
                        onChange={(e) => setAssignStatutIsActive(e.target.checked)}
                        className="rounded border-gray-300"
                        id="assignStatutIsActiveEdit"
                      />
                      <label htmlFor="assignStatutIsActiveEdit" className="text-sm">Actif</label>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4">
                <Button variant="outline" onClick={closeEdit}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    setEditErrors({})
                    if (editTab === 'assign_statuts' && !assignDateFin) {
                      setEditErrors((prev) => ({ ...prev, date_fin: 'La date de fin est obligatoire.' }))
                      return
                    }
                    updateMutation.mutate()
                  }}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isDetailsOpen && detailsItem && detailsTab && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-r from-[#135796] to-[#0f3f6d] px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">Détails</h2>
                        <p className="mt-0.5 truncate text-sm text-white/80">
                          {detailsTab === 'assign_structures' ? 'Affectation de structure' : 'Affectation de statut'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeDetails} className="text-white hover:bg-white/15 hover:text-white">✕</Button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {detailsTab === 'assign_structures' ? (
                  <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Utilisateur</p>
                      <p className="mt-1 font-semibold text-gray-900">{detailsItem?.user?.full_name || '-'}</p>
                      <p className="mt-1 text-sm text-gray-600">{detailsItem?.user?.email || detailsItem?.user?.telephone || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Structure</p>
                      <p className="mt-1 font-semibold text-gray-900">{detailsItem?.structure?.libelle || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Affecté le</p>
                      <p className="mt-1 font-semibold text-gray-900">{detailsItem?.assigned_at ? formatDate(detailsItem.assigned_at) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Frais d'intégration</p>
                      <p className="mt-1 font-semibold text-gray-900">{formatCurrency(detailsItem?.frais_integration || 0)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-gray-500">Statut</p>
                      <div className="mt-1">{renderIsActiveBadge(!!detailsItem?.is_active)}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-gray-500">Remarques</p>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{detailsItem?.remarks || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Utilisateur</p>
                      <p className="mt-1 font-semibold text-gray-900">{detailsItem?.user?.full_name || '-'}</p>
                      <p className="mt-1 text-sm text-gray-600">{detailsItem?.user?.email || detailsItem?.user?.telephone || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Statut</p>
                      <p className="mt-1 font-semibold text-gray-900">{detailsItem?.statut?.libelle || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Date début</p>
                      <p className="mt-1 font-semibold text-gray-900">{detailsItem?.date_debut ? formatDate(detailsItem.date_debut) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Date fin</p>
                      <p className="mt-1 font-semibold text-gray-900">{detailsItem?.date_fin ? formatDate(detailsItem.date_fin) : '-'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-gray-500">Statut</p>
                      <div className="mt-1">{renderIsActiveBadge(!!detailsItem?.is_active)}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-gray-500">Remarques</p>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{detailsItem?.remarks || '-'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4">
                <Button variant="outline" onClick={closeDetails}>Fermer</Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isDeleteOpen && deleteTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h2>
                <Button variant="ghost" size="icon" onClick={closeDelete}>
                  ✕
                </Button>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Supprimer <span className="font-medium text-gray-900">{deleteTarget.label}</span> ?
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={closeDelete}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-darkslate mb-2">Affectations</h1>
          <p className="text-gray-600">Gérez les affectations des structures et des statuts</p>
        </div>
        <Button
          onClick={() => {
            setCreateErrors({})
            setIsCreateOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {currentTab.addLabel}
        </Button>
      </div>

      <div className="flex gap-2 border-b flex-wrap">
        <Button
          variant={activeTab === 'assign_structures' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('assign_structures')
            setIsCreateOpen(false)
            closeEdit()
            closeDelete()
          }}
          className="rounded-none"
        >
          <Building className="w-4 h-4 mr-2" />
          Structures
        </Button>
        <Button
          variant={activeTab === 'assign_statuts' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('assign_statuts')
            setIsCreateOpen(false)
            closeEdit()
            closeDelete()
          }}
          className="rounded-none"
        >
          <Users className="w-4 h-4 mr-2" />
          Statuts
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">{currentTab.title}</CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={currentTab.columns}
            data={currentTab.data}
            loading={currentTab.loading}
            emptyMessage={currentTab.emptyMessage}
          />
        </CardContent>
      </Card>

      {activeTab === 'assign_structures' && (
        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total frais d'intégration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[#9C5931]">{formatCurrency(joiningFeesTotal)}</div>
            <p className="text-xs text-gray-500 mt-1">Sur toutes les affectations de structures</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
