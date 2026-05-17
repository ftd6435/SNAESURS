import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Plus, Search, Pencil, Trash2, Power, SlidersHorizontal, CalendarDays, Building2, Layers } from 'lucide-react'
import { endOfDay, endOfMonth, endOfToday, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfToday, startOfWeek, startOfYear, subDays } from 'date-fns'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import DataTable from '@/components/shared/DataTable'
import { depensesApi, structuresApi, typeDepensesApi } from '@/services/api/users'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { canManageFinancials, canManageSettings, getActiveStructureIds } from '@/lib/access'
import { toast } from '@/components/ui/sonner'

type ActiveTab = 'depenses' | 'type_depenses'

export default function DepensesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('depenses')
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
  const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>(undefined)
  const [montant, setMontant] = useState<string>('')
  const [commentaire, setCommentaire] = useState<string>('')
  const [createTypeLibelle, setCreateTypeLibelle] = useState('')
  const [createTypeDescription, setCreateTypeDescription] = useState('')
  const [createTypeIsActive, setCreateTypeIsActive] = useState(true)

  const user = useAuthStore((state) => state.user)
  const canManage = canManageFinancials(user)
  const canManageTypes = canManageSettings(user)
  const queryClient = useQueryClient()
  const activeStructureIds = getActiveStructureIds(user)
  const isMember = user?.role === 'membre'
  const memberStructureId = isMember ? activeStructureIds[0] : undefined

  useEffect(() => {
    if (isMember && selectedStructureId === undefined && memberStructureId !== undefined) {
      setSelectedStructureId(memberStructureId)
    }
  }, [isMember, memberStructureId, selectedStructureId])

  useEffect(() => {
    if (!isMember) return
    if (memberStructureId === undefined) return
    if (filterStructureId !== memberStructureId) setFilterStructureId(memberStructureId)
  }, [filterStructureId, isMember, memberStructureId])

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

  const resetDepenseForm = () => {
    setEditId(null)
    setSelectedTypeId(undefined)
    setMontant('')
    setCommentaire('')
  }

  const resetTypeDepenseForm = () => {
    setEditId(null)
    setCreateTypeLibelle('')
    setCreateTypeDescription('')
    setCreateTypeIsActive(true)
  }

  if (!canManage) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accès limité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Vous pouvez consulter vos cotisations, réunions et sanctions. Les opérations financières nécessitent un statut.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const listStructureId = isMember ? memberStructureId : filterStructureId
  const listDateFrom = dateFrom || undefined
  const listDateTo = dateTo || undefined

  const depensesQuery = useQuery({
    queryKey: ['depenses', { search, structure_id: listStructureId, type_depense_id: filterTypeId, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await depensesApi.getDepenses({
        search,
        structure_id: listStructureId,
        type_depense_id: filterTypeId,
        date_from: listDateFrom,
        date_to: listDateTo,
        per_page: 20,
      })
      return response.data.data?.data || []
    },
    enabled: activeTab === 'depenses',
  })

  const depensesStatsQuery = useQuery({
    queryKey: ['depenses-stats', { search, structure_id: listStructureId, type_depense_id: filterTypeId, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await depensesApi.getDepensesStats({
        search,
        structure_id: listStructureId,
        type_depense_id: filterTypeId,
        date_from: listDateFrom,
        date_to: listDateTo,
      })
      return response.data.data
    },
    enabled: activeTab === 'depenses',
  })

  const depenses = depensesQuery.data || []
  const totalDepenses = depenses.reduce((sum: number, item: any) => {
    const value = typeof item?.montant === 'number' ? item.montant : Number(item?.montant)
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)

  const depensesStats = depensesStatsQuery.data as any
  const totalAmount = depensesStats?.totals?.total_amount ?? totalDepenses
  const totalCount = depensesStats?.totals?.total_count ?? depenses.length
  const avgAmount = depensesStats?.totals?.avg_amount ?? (totalCount ? totalAmount / totalCount : 0)
  const topType = (depensesStats?.by_type_depense || [])[0]
  const topStructure = (depensesStats?.by_structure || [])[0]

  const structuresQuery = useQuery({
    queryKey: ['structures', { for: 'depenses' }],
    queryFn: async () => {
      const response = await structuresApi.getStructures({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: !isMember,
  })

  const typeDepensesActiveQuery = useQuery({
    queryKey: ['type_depenses', { for: 'depenses-create' }],
    queryFn: async () => {
      const response = await typeDepensesApi.getTypeDepenses({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const typeDepensesFilterQuery = useQuery({
    queryKey: ['type_depenses', { for: 'depenses-filters', search: '' }],
    queryFn: async () => {
      const response = await typeDepensesApi.getTypeDepenses({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const typeDepensesAllQuery = useQuery({
    queryKey: ['type_depenses', { for: 'depenses-manage', search }],
    queryFn: async () => {
      const response = await typeDepensesApi.getTypeDepenses({ search, per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const createDepenseMutation = useMutation({
    mutationFn: () =>
      depensesApi.createDepense({
        type_depense_id: selectedTypeId!,
        structure_id: selectedStructureId!,
        montant: Number(montant),
        commentaire: commentaire || undefined,
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Dépense créée avec succès')
        queryClient.invalidateQueries({ queryKey: ['depenses'] })
        setShowCreate(false)
        setSelectedTypeId(undefined)
        setMontant('')
        setCommentaire('')
      } else {
        toast.error(result.message || 'Erreur lors de la création')
      }
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const updateDepenseMutation = useMutation({
    mutationFn: () =>
      depensesApi.updateDepense(editId!, {
        type_depense_id: selectedTypeId!,
        structure_id: selectedStructureId!,
        montant: Number(montant),
        commentaire: commentaire || undefined,
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Dépense mise à jour avec succès')
        queryClient.invalidateQueries({ queryKey: ['depenses'] })
        setShowCreate(false)
        resetDepenseForm()
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteDepenseMutation = useMutation({
    mutationFn: (id: number) => depensesApi.deleteDepense(id),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Dépense supprimée')
        queryClient.invalidateQueries({ queryKey: ['depenses'] })
        setDeleteTarget(null)
      } else {
        toast.error(result.message || 'Erreur lors de la suppression')
      }
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const createTypeDepenseMutation = useMutation({
    mutationFn: () =>
      typeDepensesApi.createTypeDepense({
        libelle: createTypeLibelle,
        description: createTypeDescription || undefined,
        is_active: createTypeIsActive,
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Type de dépense créé avec succès')
        queryClient.invalidateQueries({ queryKey: ['type_depenses'] })
        setShowCreate(false)
        setCreateTypeLibelle('')
        setCreateTypeDescription('')
        setCreateTypeIsActive(true)
      } else {
        toast.error(result.message || 'Erreur lors de la création')
      }
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const updateTypeDepenseMutation = useMutation({
    mutationFn: () =>
      typeDepensesApi.updateTypeDepense(editId!, {
        libelle: createTypeLibelle,
        description: createTypeDescription || undefined,
        is_active: createTypeIsActive,
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Type de dépense mis à jour avec succès')
        queryClient.invalidateQueries({ queryKey: ['type_depenses'] })
        setShowCreate(false)
        resetTypeDepenseForm()
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteTypeDepenseMutation = useMutation({
    mutationFn: (id: number) => typeDepensesApi.deleteTypeDepense(id),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Type de dépense supprimé')
        queryClient.invalidateQueries({ queryKey: ['type_depenses'] })
        setDeleteTarget(null)
      } else {
        toast.error(result.message || 'Erreur lors de la suppression')
      }
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const toggleTypeDepenseActiveMutation = useMutation({
    mutationFn: (payload: { id: number; next: boolean }) => typeDepensesApi.updateTypeDepenseActive(payload.id, payload.next),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Statut mis à jour')
        queryClient.invalidateQueries({ queryKey: ['type_depenses'] })
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const depenseColumns = [
    {
      key: 'type_depense',
      header: 'Type',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <CreditCard className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.type_depense?.libelle || '-'}</p>
            {item.structure?.libelle && <p className="text-sm text-gray-500">{item.structure.libelle}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (item: any) => <span className="font-medium text-warning">{formatCurrency(item.montant)}</span>,
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
              setActiveTab('depenses')
              setSelectedStructureId(item.structure?.id || item.structure_id)
              setSelectedTypeId(item.type_depense?.id || item.type_depense_id)
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
            onClick={() => setDeleteTarget({ kind: 'depenses', id: item.id, label: `${item.type_depense?.libelle || '-'} (${formatCurrency(item.montant)})` })}
          >
            <Trash2 className="w-4 h-4 text-error" />
          </Button>
        </div>
      ),
    },
  ]

  const typeDepenseColumns = [
    {
      key: 'libelle',
      header: 'Nom',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <CreditCard className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.libelle}</p>
            {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Actif',
      cell: (item: any) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
          {item.is_active ? 'Oui' : 'Non'}
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
                  title={item.is_active ? 'Désactiver' : 'Activer'}
                  onClick={() => toggleTypeDepenseActiveMutation.mutate({ id: item.id, next: !item.is_active })}
                  disabled={toggleTypeDepenseActiveMutation.isPending}
                >
                  <Power className={`w-4 h-4 ${item.is_active ? 'text-warning' : 'text-gray-400'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Modifier"
                  onClick={() => {
                    setShowCreate(true)
                    setEditId(item.id)
                    setActiveTab('type_depenses')
                    setCreateTypeLibelle(item.libelle || '')
                    setCreateTypeDescription(item.description || '')
                    setCreateTypeIsActive(!!item.is_active)
                  }}
                >
                  <Pencil className="w-4 h-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Supprimer"
                  onClick={() => setDeleteTarget({ kind: 'type_depenses', id: item.id, label: item.libelle })}
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
                  if (deleteTarget.kind === 'depenses') deleteDepenseMutation.mutate(deleteTarget.id)
                  else deleteTypeDepenseMutation.mutate(deleteTarget.id)
                }}
                disabled={deleteDepenseMutation.isPending || deleteTypeDepenseMutation.isPending}
              >
                {deleteDepenseMutation.isPending || deleteTypeDepenseMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-darkslate mb-2">Dépenses</h1>
          <p className="text-gray-600">Gérez les dépenses et les types de dépenses</p>
        </div>
        {(activeTab === 'depenses' || (activeTab === 'type_depenses' && canManageTypes)) && (
          <Button
            onClick={() => {
              if (showCreate) {
                setShowCreate(false)
                if (activeTab === 'depenses') resetDepenseForm()
                else resetTypeDepenseForm()
                return
              }
              setShowCreate(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreate ? 'Fermer' : activeTab === 'depenses' ? 'Ajouter une dépense' : 'Ajouter un type'}
          </Button>
        )}
      </div>

      {showCreate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {editId
                ? activeTab === 'depenses' ? 'Modifier la dépense' : 'Modifier le type de dépense'
                : activeTab === 'depenses' ? 'Nouvelle dépense' : 'Nouveau type de dépense'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'depenses' ? (
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
                    <label className="text-sm font-medium">Type de dépense *</label>
                    <select
                      value={selectedTypeId ?? ''}
                      onChange={(e) => setSelectedTypeId(e.target.value ? Number(e.target.value) : undefined)}
                      className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    >
                      <option value="">Sélectionner...</option>
                      {(typeDepensesActiveQuery.data || []).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.libelle}</option>
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
                      if (!selectedStructureId || !selectedTypeId || !montant) return
                      if (editId) {
                        updateDepenseMutation.mutate()
                      } else {
                        createDepenseMutation.mutate()
                      }
                    }}
                    disabled={
                      !selectedStructureId ||
                      !selectedTypeId ||
                      !montant ||
                      createDepenseMutation.isPending ||
                      updateDepenseMutation.isPending
                    }
                  >
                    {editId
                      ? updateDepenseMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'
                      : createDepenseMutation.isPending ? 'Création...' : 'Créer la dépense'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Libellé *</label>
                    <Input value={createTypeLibelle} onChange={(e) => setCreateTypeLibelle(e.target.value)} placeholder="Ex: Achat de fournitures" />
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
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={createTypeIsActive}
                      onChange={(e) => setCreateTypeIsActive(e.target.checked)}
                      className="rounded border-gray-300"
                      id="createTypeIsActive"
                    />
                    <label htmlFor="createTypeIsActive" className="text-sm">Actif</label>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      if (!createTypeLibelle.trim()) return
                      if (editId) {
                        updateTypeDepenseMutation.mutate()
                      } else {
                        createTypeDepenseMutation.mutate()
                      }
                    }}
                    disabled={!createTypeLibelle.trim() || createTypeDepenseMutation.isPending || updateTypeDepenseMutation.isPending}
                  >
                    {editId
                      ? updateTypeDepenseMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'
                      : createTypeDepenseMutation.isPending ? 'Création...' : 'Créer le type'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-warning" />
              <span className="font-heading text-2xl text-warning">{formatCurrency(totalDepenses)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'depenses' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('depenses')
            setShowCreate(false)
            resetTypeDepenseForm()
          }}
          className="rounded-none"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Dépenses
        </Button>
        <Button
          variant={activeTab === 'type_depenses' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('type_depenses')
            setShowCreate(false)
            resetDepenseForm()
          }}
          className="rounded-none"
        >
          Types de dépenses
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">
              {activeTab === 'depenses' ? 'Toutes les dépenses' : 'Types de dépenses'}
            </CardTitle>
            {activeTab === 'depenses' ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="search"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={periodPreset}
                      onChange={(e) => setPeriodPreset(e.target.value as any)}
                      className="flex h-10 w-full sm:w-44 rounded-lg border-2 border-gray-200 bg-white pl-10 pr-3 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    >
                      <option value="all">Toute période</option>
                      <option value="today">Aujourd’hui</option>
                      <option value="yesterday">Hier</option>
                      <option value="week">Cette semaine</option>
                      <option value="month">Ce mois</option>
                      <option value="year">Cette année</option>
                      <option value="custom">Personnalisé</option>
                    </select>
                  </div>

                  <Button
                    variant={showAdvancedFilters ? 'default' : 'outline'}
                    onClick={() => setShowAdvancedFilters((v) => !v)}
                    className="gap-2"
                    type="button"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Avancé
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            )}
          </div>

          {activeTab === 'depenses' && showAdvancedFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {periodPreset === 'custom' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Du</label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Au</label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </>
              )}

              {!isMember && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Structure</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={filterStructureId ?? ''}
                      onChange={(e) => setFilterStructureId(e.target.value ? Number(e.target.value) : undefined)}
                      className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white pl-10 pr-3 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    >
                      <option value="">Toutes</option>
                      {(structuresQuery.data || []).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.libelle}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Type</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterTypeId ?? ''}
                    onChange={(e) => setFilterTypeId(e.target.value ? Number(e.target.value) : undefined)}
                    className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white pl-10 pr-3 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                  >
                    <option value="">Tous</option>
                    {(typeDepensesFilterQuery.data || []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.libelle}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {activeTab === 'depenses' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Total dépenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#9C5931]">{formatCurrency(totalAmount)}</div>
                    <p className="text-xs text-gray-500 mt-1">Période sélectionnée</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Nombre</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#135796]">{totalCount}</div>
                    <p className="text-xs text-gray-500 mt-1">Dépenses</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Moyenne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#1E6EC0]">{formatCurrency(avgAmount)}</div>
                    <p className="text-xs text-gray-500 mt-1">Par dépense</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Top catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-base font-semibold text-gray-900 truncate" title={topType?.libelle || ''}>
                      {topType?.libelle || '-'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {topType ? `${formatCurrency(topType.total_amount)} • ${topType.total_count} ops` : (topStructure ? `${topStructure.libelle}` : '—')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <DataTable columns={depenseColumns} data={depenses} loading={depensesQuery.isLoading} emptyMessage="Aucune dépense trouvée" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Dépenses par type</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(depensesStats?.by_type_depense || []).map((x: any) => ({ name: x?.libelle || '—', total: Number(x?.total_amount ?? 0) }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} height={60} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#135796" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Dépenses par structure</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(depensesStats?.by_structure || []).map((x: any) => ({ name: x?.libelle || '—', total: Number(x?.total_amount ?? 0) }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} height={60} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#9C5931" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <DataTable
              columns={typeDepenseColumns}
              data={typeDepensesAllQuery.data || []}
              loading={typeDepensesAllQuery.isLoading}
              emptyMessage="Aucun type de dépense trouvé"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
