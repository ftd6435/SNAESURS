import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, Plus, Search, Calendar, Clock, Lock, Unlock, Pencil, Trash2, Eye, SlidersHorizontal, CalendarDays, Building2, Layers } from 'lucide-react'
import { endOfDay, endOfMonth, endOfToday, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfToday, startOfWeek, startOfYear, subDays } from 'date-fns'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import DataTable from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import { initCotisationsApi, cotisationsApi, typeCotisationsApi, structuresApi, usersApi } from '@/services/api/users'
import { toast } from '@/components/ui/sonner'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { getActiveStructureIds, hasActiveStatut, isReadonlyMember } from '@/lib/access'

type ActiveTab = 'init' | 'individual'

export default function CotisationsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('init')
  const [search, setSearch] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [periodPreset, setPeriodPreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [filterStructureId, setFilterStructureId] = useState<number | undefined>(undefined)
  const [filterTypeCotisationId, setFilterTypeCotisationId] = useState<number | undefined>(undefined)
  const [filterIsCompleted, setFilterIsCompleted] = useState<'all' | 'open' | 'completed'>('all')
  const [selectedInit, setSelectedInit] = useState<number | undefined>(undefined)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editKind, setEditKind] = useState<ActiveTab>('init')
  const [editId, setEditId] = useState<number | undefined>(undefined)
  const [deleteKind, setDeleteKind] = useState<ActiveTab>('init')
  const [deleteId, setDeleteId] = useState<number | undefined>(undefined)
  const [deleteTitle, setDeleteTitle] = useState('')
  const [deleteSubtitle, setDeleteSubtitle] = useState('')
  const [detailsKind, setDetailsKind] = useState<ActiveTab>('init')
  const [detailsItem, setDetailsItem] = useState<any | undefined>(undefined)
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [initLibelle, setInitLibelle] = useState('')
  const [initDescription, setInitDescription] = useState('')
  const [initMontant, setInitMontant] = useState('')
  const [initDateLimite, setInitDateLimite] = useState('')
  const [initTypeCotisationId, setInitTypeCotisationId] = useState<number | undefined>(undefined)
  const [initStructureId, setInitStructureId] = useState<number | undefined>(undefined)
  const [cotisationInitId, setCotisationInitId] = useState<number | undefined>(undefined)
  const [cotisationUserId, setCotisationUserId] = useState<number | undefined>(undefined)
  const [cotisationAmount, setCotisationAmount] = useState('')
  const [cotisationPaidAt, setCotisationPaidAt] = useState('')
  const user = useAuthStore((state) => state.user)
  const readonlyMember = isReadonlyMember(user)
  const memberHasStatut = hasActiveStatut(user)
  const activeStructureIds = getActiveStructureIds(user)
  const structureId = activeStructureIds[0]
  const activeStructureLabel = (user?.assign_structures ?? []).find((s) => s.is_active)?.structure?.libelle
  const queryClient = useQueryClient()
  const listStructureId = user?.role === 'membre' ? structureId : filterStructureId

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

  const listDateFrom = dateFrom || undefined
  const listDateTo = dateTo || undefined
  const listIsCompleted =
    filterIsCompleted === 'all' ? undefined : filterIsCompleted === 'completed'

  const initCotisationsQuery = useQuery({
    queryKey: ['initCotisations', { search, structure_id: listStructureId, type_cotisation_id: filterTypeCotisationId, is_completed: listIsCompleted }],
    queryFn: async () => {
      const response = await initCotisationsApi.getInitCotisations({
        search,
        structure_id: listStructureId,
        type_cotisation_id: filterTypeCotisationId,
        is_completed: listIsCompleted,
        per_page: 20,
      })
      return response.data.data?.data || []
    },
  })

  const cotisationsQuery = useQuery({
    queryKey: ['cotisations', { search, init_cotisation_id: selectedInit, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await cotisationsApi.getCotisations({
        search,
        init_cotisation_id: selectedInit,
        user_id: readonlyMember ? user?.id : undefined,
        date_from: listDateFrom,
        date_to: listDateTo,
        per_page: 20,
      })
      return response.data.data?.data || []
    },
  })

  const initCotisations = initCotisationsQuery.data || []
  const cotisations = cotisationsQuery.data || []

  const cotisationsStatsQuery = useQuery({
    queryKey: ['cotisations-stats', { search, init_cotisation_id: selectedInit, date_from: listDateFrom, date_to: listDateTo, user_id: readonlyMember ? user?.id : undefined }],
    queryFn: async () => {
      const response = await cotisationsApi.getCotisationsStats({
        search,
        init_cotisation_id: selectedInit,
        user_id: readonlyMember ? user?.id : undefined,
        date_from: listDateFrom,
        date_to: listDateTo,
      })
      return response.data.data
    },
    enabled: activeTab === 'individual',
  })

  const cotisationsStats = cotisationsStatsQuery.data as any
  const paidTotalAmount = cotisationsStats?.paid?.total_amount ?? 0
  const paidTotalCount = cotisationsStats?.paid?.total_count ?? 0
  const paidAvgAmount = cotisationsStats?.paid?.avg_amount ?? (paidTotalCount ? paidTotalAmount / paidTotalCount : 0)
  const unpaidTotalAmount = cotisationsStats?.unpaid?.total_amount ?? 0
  const unpaidTotalCount = cotisationsStats?.unpaid?.total_count ?? 0

  const availableInitCotisations = initCotisations.filter((i: any) => !i?.is_completed)
  const effectiveCotisationInitId = (() => {
    const candidate = cotisationInitId ?? selectedInit
    if (!candidate) return undefined
    const init = initCotisations.find((i: any) => i.id === candidate)
    if (!init || init.is_completed) return undefined
    return candidate
  })()

  useEffect(() => {
    if (!isCreateOpen) return
    if (activeTab !== 'init') return
    if (!user) return
    if (user.role === 'membre') {
      if (structureId && !initStructureId) setInitStructureId(structureId)
      return
    }
    if (user.role === 'super_admin') return
    if (activeStructureIds.length === 1 && !initStructureId) setInitStructureId(activeStructureIds[0])
  }, [activeStructureIds, activeTab, initStructureId, isCreateOpen, structureId, user])

  useEffect(() => {
    if (!isCreateOpen) return
    if (activeTab !== 'individual') return
    if (cotisationPaidAt) return
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setCotisationPaidAt(`${yyyy}-${mm}-${dd}`)
  }, [activeTab, cotisationPaidAt, isCreateOpen])

  useEffect(() => {
    if (!effectiveCotisationInitId) return
    const init = initCotisations.find((i: any) => i.id === effectiveCotisationInitId)
    if (init?.montant === undefined || init?.montant === null) return
    setCotisationAmount(String(init.montant))
  }, [effectiveCotisationInitId, initCotisations])

  const typeCotisationsQuery = useQuery({
    queryKey: ['type_cotisations', { for: 'cotisations-create' }],
    queryFn: async () => {
      const response = await typeCotisationsApi.getTypeCotisations({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: !readonlyMember,
  })

  const typeCotisationsFilterQuery = useQuery({
    queryKey: ['type_cotisations', { for: 'cotisations-filters' }],
    queryFn: async () => {
      const response = await typeCotisationsApi.getTypeCotisations({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const structuresQuery = useQuery({
    queryKey: ['structures', { for: 'cotisations-create' }],
    queryFn: async () => {
      const response = await structuresApi.getStructures({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: !readonlyMember && user?.role !== 'membre',
  })

  const usersQueryInitId = (() => {
    if (activeTab === 'individual' && isCreateOpen) return effectiveCotisationInitId
    if (isEditOpen && editKind === 'individual') return cotisationInitId
    return undefined
  })()

  const usersQuery = useQuery({
    queryKey: ['users', { for: 'cotisations', init_cotisation_id: usersQueryInitId, structure_id: usersQueryInitId ? undefined : structureId }],
    queryFn: async () => {
      if (usersQueryInitId) {
        const response = await usersApi.getUsers({ per_page: 200, init_cotisation_id: usersQueryInitId })
        return response.data.data?.data || []
      }

      if (!structureId) return []
      const response = await usersApi.getUsers({ per_page: 200, structure_id: structureId })
      return response.data.data?.data || []
    },
    enabled: !readonlyMember && (!!usersQueryInitId || !!structureId),
  })

  const selectableStructures = (structuresQuery.data || []).filter((s: any) => {
    if (user?.role === 'super_admin') return true
    if (user?.role === 'admin' && memberHasStatut) return true
    if (activeStructureIds.length === 0) return true
    return activeStructureIds.includes(s.id)
  })

  const closeCreate = () => {
    setIsCreateOpen(false)
    setCreateErrors({})
    setInitLibelle('')
    setInitDescription('')
    setInitMontant('')
    setInitDateLimite('')
    setInitTypeCotisationId(undefined)
    setInitStructureId(undefined)
    setCotisationInitId(undefined)
    setCotisationUserId(undefined)
    setCotisationAmount('')
    setCotisationPaidAt('')
  }

  const closeEdit = () => {
    setIsEditOpen(false)
    setEditErrors({})
    setEditId(undefined)
    setEditKind('init')
    setInitLibelle('')
    setInitDescription('')
    setInitMontant('')
    setInitDateLimite('')
    setInitTypeCotisationId(undefined)
    setInitStructureId(undefined)
    setCotisationInitId(undefined)
    setCotisationUserId(undefined)
    setCotisationAmount('')
    setCotisationPaidAt('')
  }

  const closeDelete = () => {
    setIsDeleteOpen(false)
    setDeleteId(undefined)
    setDeleteKind('init')
    setDeleteTitle('')
    setDeleteSubtitle('')
  }

  const closeDetails = () => {
    setIsDetailsOpen(false)
    setDetailsKind('init')
    setDetailsItem(undefined)
  }

  const openEditInit = (item: any) => {
    setEditErrors({})
    setEditKind('init')
    setEditId(item.id)
    setInitLibelle(item.libelle || '')
    setInitDescription(item.description || '')
    setInitMontant(String(item.montant ?? ''))
    setInitDateLimite(item.date_limite || '')
    setInitTypeCotisationId(item.type_cotisation_id ?? undefined)
    setInitStructureId(item.structure_id ?? undefined)
    setIsEditOpen(true)
  }

  const openEditCotisation = (item: any) => {
    setEditErrors({})
    setEditKind('individual')
    setEditId(item.id)
    setCotisationInitId(item.init_cotisation_id ?? undefined)
    setCotisationUserId(item.user_id ?? undefined)
    setCotisationAmount(String(item.amount ?? ''))
    setCotisationPaidAt(item.paid_at ? String(item.paid_at).split('-').reverse().join('-') : '')
    setIsEditOpen(true)
  }

  const openDeleteInit = (item: any) => {
    setDeleteKind('init')
    setDeleteId(item.id)
    setDeleteTitle('Supprimer l\'initialisation ?')
    setDeleteSubtitle(item?.libelle ? `Initialisation: ${item.libelle}` : '')
    setIsDeleteOpen(true)
  }

  const openDeleteCotisation = (item: any) => {
    setDeleteKind('individual')
    setDeleteId(item.id)
    setDeleteTitle('Supprimer la cotisation ?')
    const who = item?.user?.full_name ? `Membre: ${item.user.full_name}` : ''
    setDeleteSubtitle(who)
    setIsDeleteOpen(true)
  }

  const openDetailsInit = (item: any) => {
    setDetailsKind('init')
    setDetailsItem(item)
    setIsDetailsOpen(true)
  }

  const openDetailsCotisation = (item: any) => {
    setDetailsKind('individual')
    setDetailsItem(item)
    setIsDetailsOpen(true)
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (activeTab === 'init') {
        const finalStructureId = user?.role === 'membre' ? structureId : (initStructureId ?? structureId)
        return initCotisationsApi.createInitCotisation({
          type_cotisation_id: initTypeCotisationId!,
          structure_id: finalStructureId!,
          montant: Number(initMontant),
          date_limite: initDateLimite || null,
          libelle: initLibelle,
          description: initDescription || undefined,
        })
      }

      return cotisationsApi.createCotisation({
        init_cotisation_id: cotisationInitId!,
        user_id: cotisationUserId!,
        amount: Number(cotisationAmount),
        paid_at: cotisationPaidAt || null,
      })
    },
    onSuccess: (response) => {
      const result = response.data as any
      if (result.status === 1) {
        toast.success(result.message || 'Création réussie')
        closeCreate()
        queryClient.invalidateQueries({ queryKey: ['initCotisations'] })
        queryClient.invalidateQueries({ queryKey: ['cotisations'] })
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

  const updateInitMutation = useMutation({
    mutationFn: async () => {
      const finalStructureId = user?.role === 'membre' ? structureId : initStructureId
      return initCotisationsApi.updateInitCotisation(editId!, {
        type_cotisation_id: initTypeCotisationId!,
        structure_id: finalStructureId!,
        montant: Number(initMontant),
        date_limite: initDateLimite || null,
        libelle: initLibelle,
        description: initDescription || undefined,
      })
    },
    onSuccess: (response) => {
      const result = response.data as any
      if (result.status === 1) {
        toast.success(result.message || 'Mise à jour réussie')
        closeEdit()
        queryClient.invalidateQueries({ queryKey: ['initCotisations'] })
        return
      }
      toast.error(result.message || 'Erreur lors de la mise à jour')
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

  const updateCotisationMutation = useMutation({
    mutationFn: async () => {
      return cotisationsApi.updateCotisation(editId!, {
        init_cotisation_id: cotisationInitId!,
        user_id: cotisationUserId!,
        amount: Number(cotisationAmount),
        paid_at: cotisationPaidAt || null,
      })
    },
    onSuccess: (response) => {
      const result = response.data as any
      if (result.status === 1) {
        toast.success(result.message || 'Mise à jour réussie')
        closeEdit()
        queryClient.invalidateQueries({ queryKey: ['cotisations'] })
        return
      }
      toast.error(result.message || 'Erreur lors de la mise à jour')
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

  const deleteInitMutation = useMutation({
    mutationFn: (id: number) => initCotisationsApi.deleteInitCotisation(id),
    onSuccess: (response) => {
      const result = response.data as any
      if (result.status === 1) {
        toast.success(result.message || 'Suppression réussie')
        closeDelete()
        queryClient.invalidateQueries({ queryKey: ['initCotisations'] })
        return
      }
      toast.error(result.message || 'Erreur lors de la suppression')
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const payload = error.response?.data as any
        toast.error(payload?.message || 'Erreur lors de la suppression')
        return
      }
      toast.error('Erreur lors de la suppression')
    },
  })

  const deleteCotisationMutation = useMutation({
    mutationFn: (id: number) => cotisationsApi.deleteCotisation(id),
    onSuccess: (response) => {
      const result = response.data as any
      if (result.status === 1) {
        toast.success(result.message || 'Suppression réussie')
        closeDelete()
        queryClient.invalidateQueries({ queryKey: ['cotisations'] })
        return
      }
      toast.error(result.message || 'Erreur lors de la suppression')
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const payload = error.response?.data as any
        toast.error(payload?.message || 'Erreur lors de la suppression')
        return
      }
      toast.error('Erreur lors de la suppression')
    },
  })

  const toggleCompletedMutation = useMutation({
    mutationFn: (id: number) => initCotisationsApi.toggleCompleted(id),
    onSuccess: (response) => {
      const result = response.data as any
      if (result.status === 1) {
        toast.success(result.message || 'Mise à jour réussie')
        queryClient.invalidateQueries({ queryKey: ['initCotisations'] })
        return
      }
      toast.error(result.message || 'Erreur lors de la mise à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const initColumns = [
    {
      key: 'libelle',
      header: 'Intitulé',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.libelle}</p>
            {item.type_cotisation?.libelle && (
              <p className="text-sm text-gray-500">{item.type_cotisation.libelle}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'structure',
      header: 'Structure',
      cell: (item: any) => <span className="text-sm">{item.structure?.libelle || '-'}</span>,
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (item: any) => (
        <span className="font-medium">
          {formatCurrency(item.montant || 0)}
        </span>
      ),
    },
    {
      key: 'date_limite',
      header: 'Date limite',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {item.date_limite ? formatDate(item.date_limite) : '-'}
        </div>
      ),
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (item: any) => {
        let status = 'active'
        let label = 'En cours'
        let icon = <Clock className="w-3 h-3 mr-1" />

        if (item.is_completed) {
          status = 'inactive'
          label = 'Clôturé'
          icon = <Lock className="w-3 h-3 mr-1" />
        }

        return (
          <Badge variant={status === 'inactive' ? 'outline' : 'warning'} className="flex items-center">
            {icon}
            {label}
          </Badge>
        )
      },
    },
    ...(!readonlyMember
      ? [
          {
            key: 'actions',
            header: 'Actions',
            cell: (item: any) => (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" title="Détails" onClick={() => openDetailsInit(item)}>
                  <Eye className="w-4 h-4 text-gray-500" />
                </Button>
                {!item.is_completed && (
                  <Button variant="ghost" size="icon" title="Modifier" onClick={() => openEditInit(item)}>
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </Button>
                )}
                {!item.is_completed && (
                  <Button variant="ghost" size="icon" title="Supprimer" onClick={() => openDeleteInit(item)}>
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  title={item.is_completed ? 'Ouvrir' : 'Clôturer'}
                  onClick={() => toggleCompletedMutation.mutate(item.id)}
                  disabled={toggleCompletedMutation.isPending}
                >
                  {item.is_completed ? (
                    <Unlock className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setActiveTab('individual')
                    setSelectedInit(item.id)
                  }}
                  title="Voir les cotisations"
                >
                  <DollarSign className="w-4 h-4 text-primary" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ]

  const cotisationColumns = [
    {
      key: 'user',
      header: 'Membre',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={item.user?.avatar_url || item.user?.avatar || ''} alt={item.user?.full_name || 'Utilisateur'} />
            <AvatarFallback className="bg-primary text-white font-heading">
              {((item.user?.full_name ?? '')
                .split(' ')
                .filter(Boolean)
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)) || 'NA'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{item.user?.full_name || 'N/A'}</p>
            <p className="text-sm text-gray-500">{item.user?.email || item.user?.telephone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Montant',
      cell: (item: any) => <span className="font-medium">{formatCurrency(Number(item.amount || 0))}</span>,
    },
    {
      key: 'paid_at',
      header: 'Date paiement',
      cell: (item: any) => (item.paid_at ? String(item.paid_at) : '-'),
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (item: any) => (
        <StatusBadge
          status={!!item.paid_at}
          label={item.paid_at ? 'Payé' : 'Non payé'}
        />
      ),
    },
    ...(!readonlyMember
      ? [
          {
            key: 'actions',
            header: 'Actions',
            cell: (item: any) => (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" title="Détails" onClick={() => openDetailsCotisation(item)}>
                  <Eye className="w-4 h-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" title="Modifier" onClick={() => openEditCotisation(item)}>
                  <Pencil className="w-4 h-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" title="Supprimer" onClick={() => openDeleteCotisation(item)}>
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
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
              className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl"
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
                        <h2 className="truncate text-lg font-semibold">
                          {activeTab === 'init' ? 'Initialiser une cotisation' : 'Ajouter une cotisation'}
                        </h2>
                        <p className="mt-0.5 truncate text-sm text-white/80">
                          {activeTab === 'init' ? 'Définir le montant attendu par membre' : 'Enregistrer un paiement'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeCreate} className="text-white hover:bg-white/15 hover:text-white">✕</Button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto p-6 space-y-4">
                {activeTab === 'init' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Intitulé *</label>
                      <Input value={initLibelle} onChange={(e) => setInitLibelle(e.target.value)} />
                      {createErrors.libelle && <p className="text-sm text-red-500">{createErrors.libelle}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type de cotisation *</label>
                      <select
                        value={initTypeCotisationId ?? ''}
                        onChange={(e) => setInitTypeCotisationId(e.target.value ? Number(e.target.value) : undefined)}
                        disabled={typeCotisationsQuery.isLoading || (typeCotisationsQuery.data || []).length === 0}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2 disabled:opacity-60"
                      >
                        <option value="">
                          {typeCotisationsQuery.isLoading
                            ? 'Chargement...'
                            : (typeCotisationsQuery.data || []).length === 0
                              ? 'Aucun type disponible'
                              : 'Sélectionner...'}
                        </option>
                        {(typeCotisationsQuery.data || []).map((t: any) => (
                          <option key={t.id} value={t.id}>{t.libelle}</option>
                        ))}
                      </select>
                      {createErrors.type_cotisation_id && <p className="text-sm text-red-500">{createErrors.type_cotisation_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Montant attendu *</label>
                      <Input type="number" min={0} value={initMontant} onChange={(e) => setInitMontant(e.target.value)} />
                      {createErrors.montant && <p className="text-sm text-red-500">{createErrors.montant}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date limite</label>
                      <Input type="date" value={initDateLimite} onChange={(e) => setInitDateLimite(e.target.value)} />
                      {createErrors.date_limite && <p className="text-sm text-red-500">{createErrors.date_limite}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Structure *</label>
                      <select
                        value={(user?.role === 'membre' ? structureId : initStructureId) ?? ''}
                        onChange={(e) => setInitStructureId(e.target.value ? Number(e.target.value) : undefined)}
                        disabled={user?.role === 'membre'}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2 disabled:opacity-60"
                      >
                        {user?.role === 'membre' ? (
                          <option value={structureId ?? ''}>
                            {activeStructureLabel || (structureId ? `Structure #${structureId}` : 'Structure')}
                          </option>
                        ) : (
                          <>
                            <option value="">
                              {structuresQuery.isLoading
                                ? 'Chargement...'
                                : selectableStructures.length === 0
                                  ? 'Aucune structure disponible'
                                  : 'Sélectionner...'}
                            </option>
                            {selectableStructures.map((s: any) => (
                              <option key={s.id} value={s.id}>{s.libelle}</option>
                            ))}
                          </>
                        )}
                      </select>
                      {createErrors.structure_id && <p className="text-sm text-red-500">{createErrors.structure_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={initDescription}
                        onChange={(e) => setInitDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      />
                      {createErrors.description && <p className="text-sm text-red-500">{createErrors.description}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Init cotisation *</label>
                      <select
                        value={effectiveCotisationInitId ?? ''}
                        onChange={(e) => setCotisationInitId(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      >
                        <option value="">Sélectionner...</option>
                        {availableInitCotisations.map((i: any) => (
                          <option key={i.id} value={i.id}>{i.libelle}</option>
                        ))}
                      </select>
                      {createErrors.init_cotisation_id && <p className="text-sm text-red-500">{createErrors.init_cotisation_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Membre *</label>
                      <select
                        value={cotisationUserId ?? ''}
                        onChange={(e) => setCotisationUserId(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      >
                        <option value="">
                          {usersQuery.isLoading
                            ? 'Chargement...'
                            : (usersQuery.data || []).length === 0
                              ? 'Aucun membre disponible'
                              : 'Sélectionner...'}
                        </option>
                        {(usersQuery.data || []).map((u: any) => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                      {createErrors.user_id && <p className="text-sm text-red-500">{createErrors.user_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Montant *</label>
                      <Input
                        type="number"
                        min={0}
                        max={(() => {
                          const init = initCotisations.find((i: any) => i.id === effectiveCotisationInitId)
                          return init?.montant ?? undefined
                        })()}
                        value={cotisationAmount}
                        onChange={(e) => setCotisationAmount(e.target.value)}
                      />
                      {createErrors.amount && <p className="text-sm text-red-500">{createErrors.amount}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date de paiement</label>
                      <Input type="date" value={cotisationPaidAt} onChange={(e) => setCotisationPaidAt(e.target.value)} />
                      {createErrors.paid_at && <p className="text-sm text-red-500">{createErrors.paid_at}</p>}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
                <Button variant="outline" onClick={closeCreate}>Annuler</Button>
                <Button
                  onClick={() => {
                    setCreateErrors({})
                    if (activeTab === 'init') {
                      if (!initLibelle.trim()) {
                        setCreateErrors((p) => ({ ...p, libelle: 'Le libellé est obligatoire.' }))
                        return
                      }
                      if (!initTypeCotisationId) {
                        setCreateErrors((p) => ({ ...p, type_cotisation_id: 'Le type de cotisation est obligatoire.' }))
                        return
                      }
                      if (!initMontant) {
                        setCreateErrors((p) => ({ ...p, montant: 'Le montant est obligatoire.' }))
                        return
                      }
                      if (user?.role === 'membre' && !structureId) {
                        setCreateErrors((p) => ({ ...p, structure_id: 'La structure est obligatoire.' }))
                        return
                      }
                      if (user?.role !== 'membre' && !(initStructureId ?? structureId)) {
                        setCreateErrors((p) => ({ ...p, structure_id: 'La structure est obligatoire.' }))
                        return
                      }
                    } else {
                      const finalInitId = cotisationInitId ?? selectedInit
                      if (!finalInitId) {
                        setCreateErrors((p) => ({ ...p, init_cotisation_id: 'L\'initialisation est obligatoire.' }))
                        return
                      }
                      setCotisationInitId(finalInitId)
                      if (!cotisationUserId) {
                        setCreateErrors((p) => ({ ...p, user_id: 'L\'utilisateur est obligatoire.' }))
                        return
                      }
                      if (!cotisationAmount) {
                        setCreateErrors((p) => ({ ...p, amount: 'Le montant est obligatoire.' }))
                        return
                      }
                    }
                    createMutation.mutate()
                  }}
                  disabled={createMutation.isPending || (user?.role === 'membre' && !memberHasStatut)}
                >
                  {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isEditOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl"
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
                        <h2 className="truncate text-lg font-semibold">
                          {editKind === 'init' ? 'Modifier l\'initialisation' : 'Modifier la cotisation'}
                        </h2>
                        <p className="mt-0.5 truncate text-sm text-white/80">
                          {editKind === 'init' ? (initLibelle || 'Initialisation') : 'Cotisation'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeEdit} className="text-white hover:bg-white/15 hover:text-white">✕</Button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto p-6 space-y-4">
                {editKind === 'init' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Intitulé *</label>
                      <Input value={initLibelle} onChange={(e) => setInitLibelle(e.target.value)} />
                      {editErrors.libelle && <p className="text-sm text-red-500">{editErrors.libelle}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type de cotisation *</label>
                      <select
                        value={initTypeCotisationId ?? ''}
                        onChange={(e) => setInitTypeCotisationId(e.target.value ? Number(e.target.value) : undefined)}
                        disabled={typeCotisationsQuery.isLoading || (typeCotisationsQuery.data || []).length === 0}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2 disabled:opacity-60"
                      >
                        <option value="">
                          {typeCotisationsQuery.isLoading
                            ? 'Chargement...'
                            : (typeCotisationsQuery.data || []).length === 0
                              ? 'Aucun type disponible'
                              : 'Sélectionner...'}
                        </option>
                        {(typeCotisationsQuery.data || []).map((t: any) => (
                          <option key={t.id} value={t.id}>{t.libelle}</option>
                        ))}
                      </select>
                      {editErrors.type_cotisation_id && <p className="text-sm text-red-500">{editErrors.type_cotisation_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Montant attendu *</label>
                      <Input type="number" min={0} value={initMontant} onChange={(e) => setInitMontant(e.target.value)} />
                      {editErrors.montant && <p className="text-sm text-red-500">{editErrors.montant}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date limite</label>
                      <Input type="date" value={initDateLimite} onChange={(e) => setInitDateLimite(e.target.value)} />
                      {editErrors.date_limite && <p className="text-sm text-red-500">{editErrors.date_limite}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Structure *</label>
                      <select
                        value={(user?.role === 'membre' ? structureId : initStructureId) ?? ''}
                        onChange={(e) => setInitStructureId(e.target.value ? Number(e.target.value) : undefined)}
                        disabled={user?.role === 'membre'}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2 disabled:opacity-60"
                      >
                        {user?.role === 'membre' ? (
                          <option value={structureId ?? ''}>
                            {activeStructureLabel || (structureId ? `Structure #${structureId}` : 'Structure')}
                          </option>
                        ) : (
                          <>
                            <option value="">
                              {structuresQuery.isLoading
                                ? 'Chargement...'
                                : selectableStructures.length === 0
                                  ? 'Aucune structure disponible'
                                  : 'Sélectionner...'}
                            </option>
                            {selectableStructures.map((s: any) => (
                              <option key={s.id} value={s.id}>{s.libelle}</option>
                            ))}
                          </>
                        )}
                      </select>
                      {editErrors.structure_id && <p className="text-sm text-red-500">{editErrors.structure_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={initDescription}
                        onChange={(e) => setInitDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      />
                      {editErrors.description && <p className="text-sm text-red-500">{editErrors.description}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Init cotisation *</label>
                      <select
                        value={cotisationInitId ?? ''}
                        onChange={(e) => setCotisationInitId(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      >
                        <option value="">Sélectionner...</option>
                        {initCotisations.map((i: any) => (
                          <option key={i.id} value={i.id}>{i.libelle}</option>
                        ))}
                      </select>
                      {editErrors.init_cotisation_id && <p className="text-sm text-red-500">{editErrors.init_cotisation_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Membre *</label>
                      <select
                        value={cotisationUserId ?? ''}
                        onChange={(e) => setCotisationUserId(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      >
                        <option value="">
                          {usersQuery.isLoading
                            ? 'Chargement...'
                            : (usersQuery.data || []).length === 0
                              ? 'Aucun membre disponible'
                              : 'Sélectionner...'}
                        </option>
                        {(usersQuery.data || []).map((u: any) => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                      {editErrors.user_id && <p className="text-sm text-red-500">{editErrors.user_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Montant *</label>
                      <Input
                        type="number"
                        min={0}
                        max={(() => {
                          const init = initCotisations.find((i: any) => i.id === cotisationInitId)
                          return init?.montant ?? undefined
                        })()}
                        value={cotisationAmount}
                        onChange={(e) => setCotisationAmount(e.target.value)}
                      />
                      {editErrors.amount && <p className="text-sm text-red-500">{editErrors.amount}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date de paiement</label>
                      <Input type="date" value={cotisationPaidAt} onChange={(e) => setCotisationPaidAt(e.target.value)} />
                      {editErrors.paid_at && <p className="text-sm text-red-500">{editErrors.paid_at}</p>}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
                <Button variant="outline" onClick={closeEdit}>Annuler</Button>
                <Button
                  onClick={() => {
                    setEditErrors({})
                    if (!editId) return

                    if (editKind === 'init') {
                      if (!initLibelle.trim()) {
                        setEditErrors((p) => ({ ...p, libelle: 'Le libellé est obligatoire.' }))
                        return
                      }
                      if (!initTypeCotisationId) {
                        setEditErrors((p) => ({ ...p, type_cotisation_id: 'Le type de cotisation est obligatoire.' }))
                        return
                      }
                      if (!initMontant) {
                        setEditErrors((p) => ({ ...p, montant: 'Le montant est obligatoire.' }))
                        return
                      }
                      if (user?.role === 'membre' && !structureId) {
                        setEditErrors((p) => ({ ...p, structure_id: 'La structure est obligatoire.' }))
                        return
                      }
                      if (user?.role !== 'membre' && !initStructureId) {
                        setEditErrors((p) => ({ ...p, structure_id: 'La structure est obligatoire.' }))
                        return
                      }
                      updateInitMutation.mutate()
                      return
                    }

                    if (!cotisationInitId) {
                      setEditErrors((p) => ({ ...p, init_cotisation_id: 'L\'initialisation est obligatoire.' }))
                      return
                    }
                    if (!cotisationUserId) {
                      setEditErrors((p) => ({ ...p, user_id: 'L\'utilisateur est obligatoire.' }))
                      return
                    }
                    if (!cotisationAmount) {
                      setEditErrors((p) => ({ ...p, amount: 'Le montant est obligatoire.' }))
                      return
                    }
                    updateCotisationMutation.mutate()
                  }}
                  disabled={updateInitMutation.isPending || updateCotisationMutation.isPending}
                >
                  {(updateInitMutation.isPending || updateCotisationMutation.isPending) ? 'Mise à jour...' : 'Mettre à jour'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isDeleteOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-r from-rose-600 to-red-700 px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">{deleteTitle}</h2>
                        {deleteSubtitle && <p className="mt-0.5 truncate text-sm text-white/80">{deleteSubtitle}</p>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeDelete} className="text-white hover:bg-white/15 hover:text-white">✕</Button>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                  Cette action est irréversible.
                </div>
              </div>

              <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
                <Button variant="outline" onClick={closeDelete}>Annuler</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!deleteId) return
                    if (deleteKind === 'init') {
                      deleteInitMutation.mutate(deleteId)
                      return
                    }
                    deleteCotisationMutation.mutate(deleteId)
                  }}
                  disabled={deleteInitMutation.isPending || deleteCotisationMutation.isPending}
                >
                  {(deleteInitMutation.isPending || deleteCotisationMutation.isPending) ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isDetailsOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl"
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
                        <h2 className="truncate text-lg font-semibold">
                          {detailsKind === 'init' ? 'Détails de l\'initialisation' : 'Détails de la cotisation'}
                        </h2>
                        <p className="mt-0.5 truncate text-sm text-white/80">
                          {detailsKind === 'init'
                            ? (detailsItem?.libelle || '-')
                            : (detailsItem?.user?.full_name || 'Cotisation')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeDetails} className="text-white hover:bg-white/15 hover:text-white">✕</Button>
                </div>
              </div>

              <div className="p-6">
                {detailsKind === 'init' ? (
                  <>
                    {(() => {
                      const expectedTotal = Number(detailsItem?.expected_total ?? detailsItem?.stats?.expected_total ?? 0)
                      const receivedTotal = Number(detailsItem?.received_total ?? detailsItem?.stats?.received_total ?? 0)
                      const remainingTotal = Number(detailsItem?.remaining_total ?? detailsItem?.stats?.remaining_total ?? Math.max(0, expectedTotal - receivedTotal))
                      const membersCount = Number(detailsItem?.active_members_count ?? detailsItem?.stats?.active_members_count ?? 0)
                      const ratio = expectedTotal > 0 ? Math.min(100, Math.max(0, (receivedTotal / expectedTotal) * 100)) : 0

                      return (
                        <div className="space-y-6">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border bg-gray-50 p-4">
                              <p className="text-xs font-medium text-gray-600">Total attendu</p>
                              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(expectedTotal)}</p>
                              <p className="mt-1 text-xs text-gray-500">{membersCount} membres actifs</p>
                            </div>
                            <div className="rounded-xl border bg-emerald-50 p-4">
                              <p className="text-xs font-medium text-emerald-700">Total reçu</p>
                              <p className="mt-1 text-lg font-semibold text-emerald-900">{formatCurrency(receivedTotal)}</p>
                              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-200">
                                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${ratio}%` }} />
                              </div>
                            </div>
                            <div className="rounded-xl border bg-amber-50 p-4">
                              <p className="text-xs font-medium text-amber-700">Reste à collecter</p>
                              <p className="mt-1 text-lg font-semibold text-amber-900">{formatCurrency(remainingTotal)}</p>
                              <p className="mt-1 text-xs text-amber-700">{Math.round(ratio)}% collecté</p>
                            </div>
                          </div>

                          <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500">Structure</p>
                              <p className="mt-1 font-semibold text-gray-900">{detailsItem?.structure?.libelle || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Type de cotisation</p>
                              <p className="mt-1 font-semibold text-gray-900">{detailsItem?.type_cotisation?.libelle || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Montant par membre</p>
                              <p className="mt-1 font-semibold text-gray-900">{formatCurrency(Number(detailsItem?.montant || 0))}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Date limite</p>
                              <p className="mt-1 font-semibold text-gray-900">{detailsItem?.date_limite ? formatDate(detailsItem.date_limite) : '-'}</p>
                            </div>
                          </div>

                          {detailsItem?.description && (
                            <div className="rounded-xl border p-4">
                              <p className="text-xs font-medium text-gray-500">Description</p>
                              <p className="mt-2 text-sm text-gray-900">{detailsItem.description}</p>
                            </div>
                          )}

                          <div className="flex flex-col gap-2 rounded-xl border bg-white p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={detailsItem?.is_completed ? 'outline' : 'warning'}>
                                {detailsItem?.is_completed ? 'Clôturé' : 'En cours'}
                              </Badge>
                              <span className="text-gray-600">
                                {detailsItem?.created_by?.full_name ? `Créé par ${detailsItem.created_by.full_name}` : 'Créateur inconnu'}
                              </span>
                            </div>
                            <span className="text-gray-500">
                              {detailsItem?.created_at ? formatDateTime(detailsItem.created_at) : '-'}
                            </span>
                          </div>
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Initialisation</p>
                        <p className="mt-1 font-semibold text-gray-900">{detailsItem?.init_cotisation?.libelle || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Membre</p>
                        <p className="mt-1 font-semibold text-gray-900">{detailsItem?.user?.full_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Montant</p>
                        <p className="mt-1 font-semibold text-gray-900">{formatCurrency(Number(detailsItem?.amount || 0))}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Date de paiement</p>
                        <p className="mt-1 font-semibold text-gray-900">{detailsItem?.paid_at ? String(detailsItem.paid_at) : '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-4 text-sm">
                      <span className="text-gray-600">Créé le</span>
                      <span className="font-medium text-gray-900">{detailsItem?.created_at ? formatDateTime(detailsItem.created_at) : '-'}</span>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" onClick={closeDetails}>Fermer</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-darkslate mb-2">Cotisations</h1>
          <p className="text-gray-600">Gérez les cotisations des membres</p>
        </div>
        {!readonlyMember && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'init' ? 'Initialiser une cotisation' : 'Ajouter une cotisation'}
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'init' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('init')
            setSelectedInit(undefined)
          }}
          className="rounded-none"
        >
          Init Cotisations
        </Button>
        <Button
          variant={activeTab === 'individual' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('individual')}
          className="rounded-none"
        >
          Cotisations Individuelles
        </Button>
      </div>

      {activeTab === 'individual' && selectedInit && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedInit(undefined)}
          >
            <Search className="w-4 h-4" />
          </Button>
          <p className="text-sm text-gray-600">
            Affichage des cotisations pour:{' '}
            <span className="font-medium">
              {initCotisations.find((i: any) => i.id === selectedInit)?.libelle}
            </span>
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">
              {activeTab === 'init' ? 'Initialisations de cotisations' : 'Cotisations individuelles'}
            </CardTitle>
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

              {activeTab === 'individual' && (
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
              )}

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

          {showAdvancedFilters && activeTab === 'individual' && periodPreset === 'custom' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Du</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Au</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          )}

          {showAdvancedFilters && activeTab === 'init' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {user?.role !== 'membre' && (
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
                    value={filterTypeCotisationId ?? ''}
                    onChange={(e) => setFilterTypeCotisationId(e.target.value ? Number(e.target.value) : undefined)}
                    className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white pl-10 pr-3 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                  >
                    <option value="">Tous</option>
                    {(typeCotisationsFilterQuery.data || []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.libelle}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Statut</label>
                <select
                  value={filterIsCompleted}
                  onChange={(e) => setFilterIsCompleted(e.target.value as any)}
                  className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                >
                  <option value="all">Tous</option>
                  <option value="open">En cours</option>
                  <option value="completed">Clôturé</option>
                </select>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {activeTab === 'init' ? (
            <DataTable
              columns={initColumns}
              data={initCotisations}
              loading={initCotisationsQuery.isLoading}
              emptyMessage="Aucune initialisation de cotisation trouvée"
              rowClassName={(item: any) => (!item?.is_completed ? 'bg-yellow-50 hover:bg-yellow-100' : '')}
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Encaissé</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#135796]">{formatCurrency(paidTotalAmount)}</div>
                    <p className="text-xs text-gray-500 mt-1">Paiements reçus</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Paiements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#1E6EC0]">{paidTotalCount}</div>
                    <p className="text-xs text-gray-500 mt-1">Transactions</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Moyenne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#9C5931]">{formatCurrency(paidAvgAmount)}</div>
                    <p className="text-xs text-gray-500 mt-1">Par paiement</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Impayés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#9BA9A1]">{unpaidTotalCount}</div>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(unpaidTotalAmount)} à percevoir</p>
                  </CardContent>
                </Card>
              </div>

              <DataTable
                columns={cotisationColumns}
                data={cotisations}
                loading={cotisationsQuery.isLoading}
                emptyMessage="Aucune cotisation individuelle trouvée"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cotisations (encaissées) par type</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(cotisationsStats?.by_type_cotisation || []).map((x: any) => ({ name: x?.libelle || '—', total: Number(x?.total_amount ?? 0) }))}>
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
                    <CardTitle className="text-base">Cotisations (encaissées) par structure</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(cotisationsStats?.by_structure || []).map((x: any) => ({ name: x?.libelle || '—', total: Number(x?.total_amount ?? 0) }))}>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
