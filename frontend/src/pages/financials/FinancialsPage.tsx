import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Gift, Plus, Search, Pencil, Trash2, Power, SlidersHorizontal, CalendarDays, Building2, Layers } from 'lucide-react'
import { endOfDay, endOfMonth, endOfToday, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfToday, startOfWeek, startOfYear, subDays } from 'date-fns'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import DataTable from '@/components/shared/DataTable'
import { donsApi, structuresApi, typeDonsApi, usersApi } from '@/services/api/users'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { canManageFinancials, canManageSettings, canViewDons, getActiveStructureIds, isReadonlyMember } from '@/lib/access'
import { toast } from '@/components/ui/sonner'

type ActiveTab = 'dons' | 'type_dons'

export default function DonsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dons')
  const [search, setSearch] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [periodPreset, setPeriodPreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [filterStructureId, setFilterStructureId] = useState<number | undefined>(undefined)
  const [filterTypeId, setFilterTypeId] = useState<number | undefined>(undefined)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ kind: ActiveTab; id: number; label: string } | null>(null)
  const [selectedStructureId, setSelectedStructureId] = useState<number | undefined>(undefined)
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined)
  const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>(undefined)
  const [montant, setMontant] = useState<string>('')
  const [commentaire, setCommentaire] = useState<string>('')
  const [createTypeLibelle, setCreateTypeLibelle] = useState('')
  const [createTypeDescription, setCreateTypeDescription] = useState('')
  const [createTypeMontantAttendu, setCreateTypeMontantAttendu] = useState<string>('')
  const [createTypeIsOpen, setCreateTypeIsOpen] = useState(true)
  const user = useAuthStore((state) => state.user)
  const canView = canViewDons(user)
  const canManage = canManageFinancials(user)
  const canManageTypes = canManageSettings(user)
  const queryClient = useQueryClient()
  const activeStructureIds = getActiveStructureIds(user)
  const isMember = user?.role === 'membre'
  const readonlyMember = isReadonlyMember(user)
  const memberStructureId = isMember ? activeStructureIds[0] : undefined

  useEffect(() => {
    if (isMember && canManage && selectedStructureId === undefined && memberStructureId !== undefined) {
      setSelectedStructureId(memberStructureId)
    }
  }, [canManage, isMember, memberStructureId, selectedStructureId])

  useEffect(() => {
    if (!isMember) return
    if (readonlyMember) return
    if (memberStructureId === undefined) return
    if (filterStructureId !== memberStructureId) setFilterStructureId(memberStructureId)
  }, [filterStructureId, isMember, memberStructureId, readonlyMember])

  useEffect(() => {
    if (periodPreset === 'custom') return
    if (periodPreset === 'all') {
      setDateFrom('')
      setDateTo('')
      return
    }

    const todayStart = startOfToday()
    const range =
      periodPreset === 'today'
        ? { from: todayStart, to: endOfToday() }
        : periodPreset === 'yesterday'
          ? { from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }
          : periodPreset === 'week'
            ? { from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }
            : periodPreset === 'month'
              ? { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
              : { from: startOfYear(new Date()), to: endOfYear(new Date()) }

    setDateFrom(format(range.from, 'yyyy-MM-dd'))
    setDateTo(format(range.to, 'yyyy-MM-dd'))
  }, [periodPreset])

  const resetDonForm = () => {
    setEditId(null)
    setSelectedUserId(undefined)
    setSelectedTypeId(undefined)
    setMontant('')
    setCommentaire('')
  }

  const resetTypeDonForm = () => {
    setEditId(null)
    setCreateTypeLibelle('')
    setCreateTypeDescription('')
    setCreateTypeMontantAttendu('')
    setCreateTypeIsOpen(true)
  }

  if (!canView) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accès limité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Accès refusé.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const listStructureId = readonlyMember ? undefined : (isMember ? memberStructureId : filterStructureId)
  const listUserId = readonlyMember ? user?.id : undefined
  const listDateFrom = dateFrom || undefined
  const listDateTo = dateTo || undefined

  const donsQuery = useQuery({
    queryKey: ['dons', { search, structure_id: listStructureId, user_id: listUserId, type_don_id: filterTypeId, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await donsApi.getDons({
        search,
        structure_id: listStructureId,
        user_id: listUserId,
        type_don_id: filterTypeId,
        date_from: listDateFrom,
        date_to: listDateTo,
        per_page: 20,
      })
      return response.data.data?.data || []
    },
    enabled: activeTab === 'dons',
  })

  const donsStatsQuery = useQuery({
    queryKey: ['dons-stats', { search, structure_id: listStructureId, user_id: listUserId, type_don_id: filterTypeId, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await donsApi.getDonsStats({
        search,
        structure_id: listStructureId,
        user_id: listUserId,
        type_don_id: filterTypeId,
        date_from: listDateFrom,
        date_to: listDateTo,
      })
      return response.data.data
    },
    enabled: activeTab === 'dons',
  })

  const dons = donsQuery.data || []

  const donColumns = [
    {
      key: 'user',
      header: 'Donateur',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Gift className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {item.user?.full_name || 'Anonyme'}
            </p>
            {item.type_don?.libelle && (
              <p className="text-sm text-gray-500">{item.type_don.libelle}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (item: any) => (
        <span className="font-medium text-success">{formatCurrency(item.montant)}</span>
      ),
    },
    {
      key: 'structure',
      header: 'Structure',
      cell: (item: any) => <span className="text-sm">{item.structure?.libelle || '-'}</span>,
    },
    {
      key: 'commentaire',
      header: 'Commentaire',
      cell: (item: any) => <span className="text-sm text-gray-600">{item.commentaire || '-'}</span>,
    },
    {
      key: 'created_at',
      header: 'Date',
      cell: (item: any) => formatDate(item.created_at),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: 'Actions',
            cell: (item: any) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Modifier"
                  onClick={() => {
                    setShowCreate(true)
                    setEditId(item.id)
                    setActiveTab('dons')
                    setSelectedStructureId(item.structure?.id || item.structure_id)
                    setSelectedTypeId(item.type_don?.id || item.type_don_id)
                    setSelectedUserId(item.user?.id || item.user_id)
                    setMontant(item.montant !== null && item.montant !== undefined ? String(item.montant) : '')
                    setCommentaire(item.commentaire || '')
                  }}
                >
                  <Pencil className="w-4 h-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Supprimer"
                  onClick={() => setDeleteTarget({ kind: 'dons', id: item.id, label: `${item.user?.full_name || 'Anonyme'} (${formatCurrency(item.montant)})` })}
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </Button>
              </div>
            ),
          } as any,
        ]
      : []),
  ]

  const totalDons = dons.reduce((sum: number, item: any) => {
    const value = typeof item?.montant === 'number' ? item.montant : Number(item?.montant)
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)

  const donsStats = donsStatsQuery.data as any
  const totalAmount = donsStats?.totals?.total_amount ?? totalDons
  const totalCount = donsStats?.totals?.total_count ?? dons.length
  const avgAmount = donsStats?.totals?.avg_amount ?? (totalCount ? totalAmount / totalCount : 0)
  const topType = (donsStats?.by_type_don || [])[0]
  const topStructure = (donsStats?.by_structure || [])[0]

  const structuresQuery = useQuery({
    queryKey: ['structures', { for: 'financials' }],
    queryFn: async () => {
      const response = await structuresApi.getStructures({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: canManage && !isMember,
  })

  const typeDonsQuery = useQuery({
    queryKey: ['type_dons', { for: 'financials', search }],
    queryFn: async () => {
      const response = await typeDonsApi.getTypeDons({ is_open: true, search, per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const typeDonsAllQuery = useQuery({
    queryKey: ['type_dons', { for: 'dons-manage', search }],
    queryFn: async () => {
      const response = await typeDonsApi.getTypeDons({ search, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: canManageTypes,
  })

  const usersQuery = useQuery({
    queryKey: ['users', { for: 'financials', structure_id: selectedStructureId }],
    queryFn: async () => {
      const response = await usersApi.getUsers({ structure_id: selectedStructureId, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: canManage ? (isMember ? !!selectedStructureId : true) : false,
  })

  const createDonMutation = useMutation({
    mutationFn: () =>
      donsApi.createDon({
        type_don_id: selectedTypeId!,
        structure_id: selectedStructureId!,
        user_id: selectedUserId!,
        montant: Number(montant),
        commentaire: commentaire || undefined,
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Don créé avec succès')
        queryClient.invalidateQueries({ queryKey: ['dons'] })
        setShowCreate(false)
        setSelectedUserId(undefined)
        setSelectedTypeId(undefined)
        setMontant('')
        setCommentaire('')
      } else {
        toast.error(result.message || 'Erreur lors de la création')
      }
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const updateDonMutation = useMutation({
    mutationFn: () =>
      donsApi.updateDon(editId!, {
        type_don_id: selectedTypeId!,
        structure_id: selectedStructureId!,
        user_id: selectedUserId!,
        montant: Number(montant),
        commentaire: commentaire || undefined,
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Don mis à jour avec succès')
        queryClient.invalidateQueries({ queryKey: ['dons'] })
        setShowCreate(false)
        setEditId(null)
        setSelectedUserId(undefined)
        setSelectedTypeId(undefined)
        setMontant('')
        setCommentaire('')
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteDonMutation = useMutation({
    mutationFn: (id: number) => donsApi.deleteDon(id),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Don supprimé')
        queryClient.invalidateQueries({ queryKey: ['dons'] })
        setDeleteTarget(null)
      } else {
        toast.error(result.message || 'Erreur lors de la suppression')
      }
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const createTypeDonMutation = useMutation({
    mutationFn: () =>
      typeDonsApi.createTypeDon({
        libelle: createTypeLibelle,
        description: createTypeDescription || undefined,
        montant_attendu: createTypeMontantAttendu ? Number(createTypeMontantAttendu) : undefined,
        is_open: createTypeIsOpen,
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Type de don créé avec succès')
        queryClient.invalidateQueries({ queryKey: ['type_dons'] })
        setShowCreate(false)
        setCreateTypeLibelle('')
        setCreateTypeDescription('')
        setCreateTypeMontantAttendu('')
        setCreateTypeIsOpen(true)
      } else {
        toast.error(result.message || 'Erreur lors de la création')
      }
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const updateTypeDonMutation = useMutation({
    mutationFn: () =>
      typeDonsApi.updateTypeDon(editId!, {
        libelle: createTypeLibelle,
        description: createTypeDescription || undefined,
        montant_attendu: createTypeMontantAttendu ? Number(createTypeMontantAttendu) : undefined,
        is_open: createTypeIsOpen,
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Type de don mis à jour avec succès')
        queryClient.invalidateQueries({ queryKey: ['type_dons'] })
        setShowCreate(false)
        setEditId(null)
        setCreateTypeLibelle('')
        setCreateTypeDescription('')
        setCreateTypeMontantAttendu('')
        setCreateTypeIsOpen(true)
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteTypeDonMutation = useMutation({
    mutationFn: (id: number) => typeDonsApi.deleteTypeDon(id),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Type de don supprimé')
        queryClient.invalidateQueries({ queryKey: ['type_dons'] })
        setDeleteTarget(null)
      } else {
        toast.error(result.message || 'Erreur lors de la suppression')
      }
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const toggleTypeDonOpenMutation = useMutation({
    mutationFn: (payload: { id: number; next: boolean }) => typeDonsApi.updateTypeDonActive(payload.id, payload.next),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Statut mis à jour')
        queryClient.invalidateQueries({ queryKey: ['type_dons'] })
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const typeDonColumns = [
    {
      key: 'libelle',
      header: 'Nom',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Gift className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.libelle}</p>
            {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'montant_attendu',
      header: 'Montant attendu',
      cell: (item: any) => <span className="text-sm">{item.montant_attendu !== null && item.montant_attendu !== undefined ? formatCurrency(item.montant_attendu) : '-'}</span>,
    },
    {
      key: 'is_open',
      header: 'Ouvert',
      cell: (item: any) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
          {item.is_open ? 'Oui' : 'Non'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date création',
      cell: (item: any) => formatDate(item.created_at),
    },
    ...(canManageTypes
      ? [
          {
            key: 'actions',
            header: 'Actions',
            cell: (item: any) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  title={item.is_open ? 'Fermer' : 'Ouvrir'}
                  onClick={() => toggleTypeDonOpenMutation.mutate({ id: item.id, next: !item.is_open })}
                  disabled={toggleTypeDonOpenMutation.isPending}
                >
                  <Power className={`w-4 h-4 ${item.is_open ? 'text-warning' : 'text-gray-400'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Modifier"
                  onClick={() => {
                    setShowCreate(true)
                    setEditId(item.id)
                    setActiveTab('type_dons')
                    setCreateTypeLibelle(item.libelle || '')
                    setCreateTypeDescription(item.description || '')
                    setCreateTypeMontantAttendu(item.montant_attendu !== null && item.montant_attendu !== undefined ? String(item.montant_attendu) : '')
                    setCreateTypeIsOpen(!!item.is_open)
                  }}
                >
                  <Pencil className="w-4 h-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Supprimer"
                  onClick={() => setDeleteTarget({ kind: 'type_dons', id: item.id, label: item.libelle })}
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </Button>
              </div>
            ),
          } as any,
        ]
      : []),
  ]

  return (
    <div className="p-6 space-y-6">
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h2>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(null)}>
                ✕
              </Button>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Supprimer <span className="font-medium text-gray-900">{deleteTarget.label}</span> ?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteTarget.kind === 'dons') deleteDonMutation.mutate(deleteTarget.id)
                  else deleteTypeDonMutation.mutate(deleteTarget.id)
                }}
                disabled={deleteDonMutation.isPending || deleteTypeDonMutation.isPending}
              >
                {deleteDonMutation.isPending || deleteTypeDonMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-darkslate mb-2">Dons</h1>
          <p className="text-gray-600">Gérez les dons et les types de dons</p>
        </div>
        {((activeTab === 'dons' && canManage) || (activeTab === 'type_dons' && canManageTypes)) && (
          <Button
            onClick={() => {
              if (showCreate) {
                setShowCreate(false)
                if (activeTab === 'dons') resetDonForm()
                else resetTypeDonForm()
                return
              }
              setShowCreate(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreate ? 'Fermer' : activeTab === 'dons' ? 'Ajouter un don' : 'Ajouter un type'}
          </Button>
        )}
      </div>

      {showCreate && ((activeTab === 'dons' && canManage) || (activeTab === 'type_dons' && canManageTypes)) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {editId
                ? activeTab === 'dons' ? 'Modifier le don' : 'Modifier le type de don'
                : activeTab === 'dons' ? 'Nouveau don' : 'Nouveau type de don'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'dons' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Structure *</label>
                    {isMember ? (
                      <Input value={user?.assign_structures?.find((s) => s.is_active)?.structure?.libelle || 'Ma structure'} disabled />
                    ) : (
                      <select
                        value={selectedStructureId ?? ''}
                        onChange={(e) => setSelectedStructureId(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      >
                        <option value="">Sélectionner...</option>
                        {(structuresQuery.data || []).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.libelle}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type de don *</label>
                    <select
                      value={selectedTypeId ?? ''}
                      onChange={(e) => setSelectedTypeId(e.target.value ? Number(e.target.value) : undefined)}
                      className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    >
                      <option value="">Sélectionner...</option>
                      {(typeDonsQuery.data || []).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.libelle}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Donateur *</label>
                    <select
                      value={selectedUserId ?? ''}
                      onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : undefined)}
                      className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    >
                      <option value="">{usersQuery.isLoading ? 'Chargement...' : 'Sélectionner...'}</option>
                      {(usersQuery.data || []).map((u: any) => (
                        <option key={u.id} value={u.id}>{u.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Montant (GNF) *</label>
                    <Input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="0" />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Commentaire</label>
                    <textarea
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      if (!selectedStructureId || !selectedTypeId || !selectedUserId || !montant) return
                      if (editId) {
                        updateDonMutation.mutate()
                      } else {
                        createDonMutation.mutate()
                      }
                    }}
                    disabled={
                      !selectedStructureId ||
                      !selectedTypeId ||
                      !selectedUserId ||
                      !montant ||
                      createDonMutation.isPending ||
                      updateDonMutation.isPending
                    }
                  >
                    {editId
                      ? updateDonMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'
                      : createDonMutation.isPending ? 'Création...' : 'Créer le don'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Libellé *</label>
                    <Input value={createTypeLibelle} onChange={(e) => setCreateTypeLibelle(e.target.value)} placeholder="Ex: Don en espèces" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={createTypeDescription}
                      onChange={(e) => setCreateTypeDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Montant attendu (GNF)</label>
                    <Input type="number" min={0} value={createTypeMontantAttendu} onChange={(e) => setCreateTypeMontantAttendu(e.target.value)} placeholder="0" />
                  </div>
                  <div className="flex items-center gap-2 mt-7">
                    <input
                      type="checkbox"
                      checked={createTypeIsOpen}
                      onChange={(e) => setCreateTypeIsOpen(e.target.checked)}
                      className="rounded border-gray-300"
                      id="createTypeIsOpen"
                    />
                    <label htmlFor="createTypeIsOpen" className="text-sm">Ouvert</label>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      if (!createTypeLibelle.trim()) return
                      if (editId) {
                        updateTypeDonMutation.mutate()
                      } else {
                        createTypeDonMutation.mutate()
                      }
                    }}
                    disabled={!createTypeLibelle.trim() || createTypeDonMutation.isPending || updateTypeDonMutation.isPending}
                  >
                    {editId
                      ? updateTypeDonMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'
                      : createTypeDonMutation.isPending ? 'Création...' : 'Créer le type'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'dons' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Total Dons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading text-2xl text-success">
                    {donsStatsQuery.isLoading ? '-' : formatCurrency(totalAmount)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Montant cumulé</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Nombre de dons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading text-2xl text-darkslate">
                    {donsStatsQuery.isLoading ? '-' : totalCount}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Transactions</p>
                </div>
                <div className="p-2 rounded-lg bg-sage/20">
                  <Layers className="w-6 h-6 text-sage" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Don moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading text-2xl text-darkslate">
                    {donsStatsQuery.isLoading ? '-' : formatCurrency(avgAmount)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Moyenne</p>
                </div>
                <div className="p-2 rounded-lg bg-accent-beige/40">
                  <CalendarDays className="w-6 h-6 text-accent-wood" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Top catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-heading text-base text-darkslate truncate">
                    {donsStatsQuery.isLoading ? '-' : (topType?.libelle || '-')}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {donsStatsQuery.isLoading
                      ? '-'
                      : `${formatCurrency(topType?.total_amount)}${topStructure?.libelle ? ` • ${topStructure.libelle}` : ''}`}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-accent-wood/15">
                  <Building2 className="w-6 h-6 text-accent-wood" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'dons' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('dons')
            setShowCreate(false)
            resetTypeDonForm()
          }}
          className="rounded-none"
        >
          <Gift className="w-4 h-4 mr-2" />
          Dons
        </Button>
        <Button
          variant={activeTab === 'type_dons' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('type_dons')
            setShowCreate(false)
            resetDonForm()
          }}
          className="rounded-none"
        >
          Types de dons
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">
              {activeTab === 'dons' ? 'Tous les dons' : 'Types de dons'}
            </CardTitle>
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
            </div>
          </div>

          {activeTab === 'dons' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border bg-white px-3 py-2">
                <label className="text-xs text-gray-500">Période</label>
                <div className="mt-1 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <select
                    value={periodPreset}
                    onChange={(e) => setPeriodPreset(e.target.value as any)}
                    className="w-full bg-transparent text-sm focus:outline-none"
                  >
                    <option value="all">Tout</option>
                    <option value="today">Aujourd’hui</option>
                    <option value="yesterday">Hier</option>
                    <option value="week">Semaine</option>
                    <option value="month">Mois</option>
                    <option value="year">Année</option>
                    <option value="custom">Personnalisé</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border bg-white px-3 py-2">
                <label className="text-xs text-gray-500">Du</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setPeriodPreset('custom')
                    setDateFrom(e.target.value)
                  }}
                  disabled={periodPreset !== 'custom'}
                  className="mt-1"
                />
              </div>

              <div className="rounded-lg border bg-white px-3 py-2">
                <label className="text-xs text-gray-500">Au</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setPeriodPreset('custom')
                    setDateTo(e.target.value)
                  }}
                  disabled={periodPreset !== 'custom'}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-3 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdvancedFilters((v) => !v)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtres avancés
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearch('')
                    setPeriodPreset('all')
                    setFilterTypeId(undefined)
                    if (!isMember) setFilterStructureId(undefined)
                  }}
                  className="text-gray-600"
                >
                  Réinitialiser
                </Button>
              </div>

              {showAdvancedFilters && (
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border bg-surface p-4">
                  <div className="rounded-lg border bg-white px-3 py-2">
                    <label className="text-xs text-gray-500">Type de don</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <select
                        value={filterTypeId ?? ''}
                        onChange={(e) => setFilterTypeId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-transparent text-sm focus:outline-none"
                      >
                        <option value="">Tous</option>
                        {(((canManageTypes ? typeDonsAllQuery.data : typeDonsQuery.data) || []) as any[]).map((t) => (
                          <option key={t.id} value={t.id}>{t.libelle}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-white px-3 py-2">
                    <label className="text-xs text-gray-500">Structure</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {isMember ? (
                        <div className="text-sm text-gray-900 w-full truncate">
                          {(user?.assign_structures ?? []).find((s) => s.is_active)?.structure?.libelle || '-'}
                        </div>
                      ) : (
                        <select
                          value={filterStructureId ?? ''}
                          onChange={(e) => setFilterStructureId(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full bg-transparent text-sm focus:outline-none"
                        >
                          <option value="">Toutes</option>
                          {((structuresQuery.data || []) as any[]).map((s) => (
                            <option key={s.id} value={s.id}>{s.libelle}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {activeTab === 'dons' ? (
            <div className="space-y-6">
              <DataTable columns={donColumns} data={dons} loading={donsQuery.isLoading} emptyMessage="Aucun don trouvé" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500">Dons par type</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(donsStats?.by_type_don || []).slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="libelle" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: any) => formatCurrency(value)}
                          labelFormatter={(label) => String(label)}
                        />
                        <Bar dataKey="total_amount" name="Montant total" fill="#135796" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500">Dons par structure</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(donsStats?.by_structure || []).slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="libelle" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: any) => formatCurrency(value)}
                          labelFormatter={(label) => String(label)}
                        />
                        <Bar dataKey="total_amount" name="Montant total" fill="#9C5931" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <DataTable
              columns={typeDonColumns}
              data={(canManageTypes ? typeDonsAllQuery.data : typeDonsQuery.data) || []}
              loading={canManageTypes ? typeDonsAllQuery.isLoading : typeDonsQuery.isLoading}
              emptyMessage="Aucun type de don trouvé"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
