import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertTriangle, Calendar, CreditCard, Gift, SlidersHorizontal, Users, Wallet } from 'lucide-react'
import { endOfDay, endOfMonth, endOfToday, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfToday, startOfWeek, startOfYear, subDays } from 'date-fns'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import DataTable from '@/components/shared/DataTable'
import { cotisationsApi, depensesApi, donsApi, reunionsApi, sanctionsApi, structuresApi, usersApi } from '@/services/api/users'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { canManageFinancials, canManageSettings, canViewDons, canViewUsers, getActiveStructureIds, isReadonlyMember } from '@/lib/access'

type PeriodPreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const readonlyMember = isReadonlyMember(user)
  const canViewMembers = canViewUsers(user)
  const canViewDonsData = canViewDons(user)
  const canViewDepensesData = canManageFinancials(user)
  const canPickStructure = canManageSettings(user) && user?.role !== 'membre'
  const isMember = user?.role === 'membre'
  const activeStructureIds = getActiveStructureIds(user)
  const memberStructureId = isMember ? activeStructureIds[0] : undefined

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('month')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [filterStructureId, setFilterStructureId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (periodPreset === 'custom') return
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

  useEffect(() => {
    if (!isMember) return
    if (memberStructureId === undefined) return
    if (filterStructureId !== memberStructureId) setFilterStructureId(memberStructureId)
  }, [filterStructureId, isMember, memberStructureId])

  const listDateFrom = dateFrom || undefined
  const listDateTo = dateTo || undefined

  const scopeStructureId = canPickStructure ? filterStructureId : undefined

  const structuresQuery = useQuery({
    queryKey: ['structures', { for: 'dashboard' }],
    queryFn: async () => {
      const response = await structuresApi.getStructures({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: canPickStructure,
  })

  const membersCountQuery = useQuery({
    queryKey: ['dashboard-members-count'],
    queryFn: async () => {
      const response = await usersApi.getUsers({ per_page: 1 })
      const payload: any = response.data.data
      const total = payload?.meta?.total ?? payload?.total
      if (typeof total === 'number') return total
      if (typeof total === 'string') return Number(total) || 0
      return Array.isArray(payload?.data) ? payload.data.length : 0
    },
    enabled: canViewMembers,
  })

  const donsStatsQuery = useQuery({
    queryKey: ['dashboard-dons-stats', { structure_id: readonlyMember ? undefined : (isMember ? memberStructureId : scopeStructureId), user_id: readonlyMember ? user?.id : undefined, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await donsApi.getDonsStats({
        structure_id: readonlyMember ? undefined : (isMember ? memberStructureId : scopeStructureId),
        user_id: readonlyMember ? user?.id : undefined,
        date_from: listDateFrom,
        date_to: listDateTo,
      })
      return response.data.data
    },
    enabled: canViewDonsData,
  })

  const depensesStatsQuery = useQuery({
    queryKey: ['dashboard-depenses-stats', { structure_id: isMember ? memberStructureId : scopeStructureId, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await depensesApi.getDepensesStats({
        structure_id: isMember ? memberStructureId : scopeStructureId,
        date_from: listDateFrom,
        date_to: listDateTo,
      })
      return response.data.data
    },
    enabled: canViewDepensesData,
  })

  const sanctionsStatsQuery = useQuery({
    queryKey: ['dashboard-sanctions-stats', { structure_id: readonlyMember ? undefined : (isMember ? memberStructureId : scopeStructureId), user_id: readonlyMember ? user?.id : undefined, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await sanctionsApi.getSanctionsStats({
        structure_id: readonlyMember ? undefined : (isMember ? memberStructureId : scopeStructureId),
        user_id: readonlyMember ? user?.id : undefined,
        date_from: listDateFrom,
        date_to: listDateTo,
      })
      return response.data.data
    },
  })

  const cotisationsStatsQuery = useQuery({
    queryKey: ['dashboard-cotisations-stats', { user_id: readonlyMember ? user?.id : undefined, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await cotisationsApi.getCotisationsStats({
        user_id: readonlyMember ? user?.id : undefined,
        date_from: listDateFrom,
        date_to: listDateTo,
      })
      return response.data.data
    },
  })

  const recentDonsQuery = useQuery({
    queryKey: ['dashboard-recent-dons', { structure_id: readonlyMember ? undefined : (isMember ? memberStructureId : scopeStructureId), user_id: readonlyMember ? user?.id : undefined, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await donsApi.getDons({
        structure_id: readonlyMember ? undefined : (isMember ? memberStructureId : scopeStructureId),
        user_id: readonlyMember ? user?.id : undefined,
        date_from: listDateFrom,
        date_to: listDateTo,
        per_page: 5,
      })
      const payload: any = response.data
      return payload?.data?.data?.data ?? payload?.data?.data ?? []
    },
    enabled: canViewDonsData,
  })

  const recentDepensesQuery = useQuery({
    queryKey: ['dashboard-recent-depenses', { structure_id: isMember ? memberStructureId : scopeStructureId, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await depensesApi.getDepenses({
        structure_id: isMember ? memberStructureId : scopeStructureId,
        date_from: listDateFrom,
        date_to: listDateTo,
        per_page: 5,
      })
      return response.data.data?.data || []
    },
    enabled: canViewDepensesData,
  })

  const recentSanctionsQuery = useQuery({
    queryKey: ['dashboard-recent-sanctions', { structure_id: readonlyMember ? undefined : (isMember ? memberStructureId : scopeStructureId), user_id: readonlyMember ? user?.id : undefined, date_from: listDateFrom, date_to: listDateTo }],
    queryFn: async () => {
      const response = await sanctionsApi.getSanctions({
        structure_id: readonlyMember ? undefined : (isMember ? memberStructureId : scopeStructureId),
        user_id: readonlyMember ? user?.id : undefined,
        date_from: listDateFrom,
        date_to: listDateTo,
        per_page: 5,
      })
      return response.data.data?.data || []
    },
  })

  const upcomingReunionsQuery = useQuery({
    queryKey: ['dashboard-upcoming-reunions', { status: 'pending', structure_id: scopeStructureId }],
    queryFn: async () => {
      const response = await reunionsApi.getReunions({
        status: 'pending',
        structure_id: isMember ? undefined : scopeStructureId,
        per_page: 5,
      })
      return response.data.data?.data || []
    },
  })

  const donsStats: any = donsStatsQuery.data
  const depensesStats: any = depensesStatsQuery.data
  const sanctionsStats: any = sanctionsStatsQuery.data
  const cotisationsStats: any = cotisationsStatsQuery.data

  const cards = useMemo(() => {
    const items: Array<{
      title: string
      value: string
      subtitle: string
      icon: any
      iconBg: string
      iconColor: string
      accent: string
    }> = []

    if (canViewMembers) {
      const value = membersCountQuery.isLoading
        ? '...'
        : membersCountQuery.isError
          ? '—'
          : String(membersCountQuery.data ?? 0)
      items.push({
        title: 'Membres',
        value,
        subtitle: 'Total des membres',
        icon: Users,
        iconBg: 'bg-blue-50',
        iconColor: 'text-[#135796]',
        accent: 'border-[#135796]',
      })
    }

    const cotisationsLoading = cotisationsStatsQuery.isLoading && !cotisationsStatsQuery.data
    const cotisationsError = cotisationsStatsQuery.isError
    const paidAmount = cotisationsStats?.paid?.total_amount ?? 0
    const unpaidAmount = cotisationsStats?.unpaid?.total_amount ?? 0
    items.push({
      title: 'Cotisations encaissées',
      value: cotisationsLoading ? '...' : cotisationsError ? '—' : formatCurrency(paidAmount),
      subtitle: `Impayés: ${formatCurrency(unpaidAmount)}`,
      icon: Wallet,
      iconBg: 'bg-[#D9C1A7]/30',
      iconColor: 'text-[#9C5931]',
      accent: 'border-[#9C5931]',
    })

    if (canViewDonsData) {
      const donsLoading = donsStatsQuery.isLoading && !donsStatsQuery.data
      const donsError = donsStatsQuery.isError
      const amount = donsStats?.totals?.total_amount ?? 0
      const count = donsStats?.totals?.total_count ?? 0
      items.push({
        title: 'Dons',
        value: donsLoading ? '...' : donsError ? '—' : formatCurrency(amount),
        subtitle: `${count} dons`,
        icon: Gift,
        iconBg: 'bg-blue-50',
        iconColor: 'text-[#1E6EC0]',
        accent: 'border-[#1E6EC0]',
      })
    }

    if (canViewDepensesData) {
      const depensesLoading = depensesStatsQuery.isLoading && !depensesStatsQuery.data
      const depensesError = depensesStatsQuery.isError
      const amount = depensesStats?.totals?.total_amount ?? 0
      const count = depensesStats?.totals?.total_count ?? 0
      items.push({
        title: 'Dépenses',
        value: depensesLoading ? '...' : depensesError ? '—' : formatCurrency(amount),
        subtitle: `${count} dépenses`,
        icon: CreditCard,
        iconBg: 'bg-amber-50',
        iconColor: 'text-[#9C5931]',
        accent: 'border-[#9C5931]',
      })
    }

    const sanctionsLoading = sanctionsStatsQuery.isLoading && !sanctionsStatsQuery.data
    const sanctionsError = sanctionsStatsQuery.isError
    const sanctionsAmount = sanctionsStats?.totals?.total_amount ?? 0
    const sanctionsCount = sanctionsStats?.totals?.total_count ?? 0
    items.push({
      title: 'Sanctions',
      value: sanctionsLoading ? '...' : sanctionsError ? '—' : formatCurrency(sanctionsAmount),
      subtitle: `${sanctionsCount} sanctions`,
      icon: AlertTriangle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      accent: 'border-rose-400',
    })

    const reunionsCount = upcomingReunionsQuery.isLoading && !upcomingReunionsQuery.data
      ? '...'
      : upcomingReunionsQuery.isError
        ? '—'
        : String((upcomingReunionsQuery.data || []).length)
    items.push({
      title: 'Réunions à venir',
      value: reunionsCount,
      subtitle: 'Statut: en cours',
      icon: Calendar,
      iconBg: 'bg-blue-50',
      iconColor: 'text-[#135796]',
      accent: 'border-[#135796]',
    })

    return items
  }, [
    canViewDonsData,
    canViewDepensesData,
    canViewMembers,
    cotisationsStats,
    cotisationsStatsQuery.data,
    cotisationsStatsQuery.isError,
    cotisationsStatsQuery.isLoading,
    depensesStats,
    depensesStatsQuery.data,
    depensesStatsQuery.isError,
    depensesStatsQuery.isLoading,
    donsStats,
    donsStatsQuery.data,
    donsStatsQuery.isError,
    donsStatsQuery.isLoading,
    membersCountQuery.data,
    membersCountQuery.isError,
    membersCountQuery.isLoading,
    sanctionsStats,
    sanctionsStatsQuery.data,
    sanctionsStatsQuery.isError,
    sanctionsStatsQuery.isLoading,
    upcomingReunionsQuery.data,
    upcomingReunionsQuery.isError,
    upcomingReunionsQuery.isLoading,
  ])

  const donsByTypeData = useMemo(() => {
    const list = (donsStats?.by_type_don || []).slice(0, 8)
    return list.map((x: any) => ({ name: x?.libelle || '—', total: Number(x?.total_amount ?? 0) }))
  }, [donsStats?.by_type_don])

  const depensesByTypeData = useMemo(() => {
    const list = (depensesStats?.by_type_depense || []).slice(0, 8)
    return list.map((x: any) => ({ name: x?.libelle || '—', total: Number(x?.total_amount ?? 0) }))
  }, [depensesStats?.by_type_depense])

  const cotisationsByTypeData = useMemo(() => {
    const list = (cotisationsStats?.by_type_cotisation || []).slice(0, 8)
    return list.map((x: any) => ({ name: x?.libelle || '—', total: Number(x?.total_amount ?? 0) }))
  }, [cotisationsStats?.by_type_cotisation])

  const sanctionsByTypeData = useMemo(() => {
    const list = (sanctionsStats?.by_type_sanction || []).slice(0, 8)
    return list.map((x: any) => ({ name: x?.libelle || '—', total: Number(x?.total_amount ?? 0) }))
  }, [sanctionsStats?.by_type_sanction])

  const recentDonsColumns = [
    {
      key: 'user',
      header: 'Donateur',
      cell: (item: any) => <span className="text-sm">{item.user?.full_name || 'Anonyme'}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (item: any) => <span className="text-sm">{item.type_don?.libelle || '-'}</span>,
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (item: any) => <span className="font-medium">{formatCurrency(item.montant)}</span>,
    },
    {
      key: 'created_at',
      header: 'Date',
      cell: (item: any) => formatDate(item.created_at),
    },
  ]

  const recentDepensesColumns = [
    {
      key: 'type',
      header: 'Type',
      cell: (item: any) => <span className="text-sm">{item.type_depense?.libelle || '-'}</span>,
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (item: any) => <span className="font-medium">{formatCurrency(item.montant)}</span>,
    },
    {
      key: 'created_at',
      header: 'Date',
      cell: (item: any) => formatDate(item.created_at),
    },
  ]

  const recentSanctionsColumns = [
    {
      key: 'user',
      header: 'Membre',
      cell: (item: any) => <span className="text-sm">{item.user?.full_name || '-'}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (item: any) => <span className="text-sm">{item.type_sanction?.libelle || '-'}</span>,
    },
    {
      key: 'montant',
      header: 'Montant',
      cell: (item: any) => <span className="font-medium">{formatCurrency(item.montant)}</span>,
    },
    {
      key: 'created_at',
      header: 'Date',
      cell: (item: any) => formatDate(item.created_at),
    },
  ]

  const upcomingReunionsColumns = [
    {
      key: 'libelle',
      header: 'Réunion',
      cell: (item: any) => <span className="text-sm font-medium">{item.libelle || '-'}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (item: any) => <span className="text-sm">{item.type === 'generale' ? 'Générale' : 'Structure'}</span>,
    },
    {
      key: 'date_reunion',
      header: 'Date',
      cell: (item: any) => (item.date_reunion ? formatDate(item.date_reunion) : '-'),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-h1 text-darkslate mb-2">Tableau de Bord</h1>
            <p className="text-gray-600">
              {readonlyMember ? 'Vue personnelle' : isMember ? 'Vue structure' : 'Vue globale'}
              {isMember && memberStructureId ? ' • Structure active' : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              value={periodPreset}
              onChange={(e) => setPeriodPreset(e.target.value as PeriodPreset)}
              className="flex h-10 w-full sm:w-44 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
            >
              <option value="today">Aujourd’hui</option>
              <option value="yesterday">Hier</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
              <option value="custom">Personnalisé</option>
            </select>

            <Button variant={showAdvancedFilters ? 'default' : 'outline'} onClick={() => setShowAdvancedFilters((v) => !v)} className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Avancé
            </Button>
          </div>
        </div>

        {showAdvancedFilters && (
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

            {canPickStructure && (
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Structure</label>
                <select
                  value={filterStructureId ?? ''}
                  onChange={(e) => setFilterStructureId(e.target.value ? Number(e.target.value) : undefined)}
                  className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                >
                  <option value="">Toutes</option>
                  {(structuresQuery.data || []).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.libelle}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.title} className={`border-l-4 ${c.accent}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{c.title}</CardTitle>
                <div className={`p-2 rounded-lg ${c.iconBg}`}>
                  <Icon className={`w-6 h-6 ${c.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-bold text-darkslate">{c.value}</div>
                <p className="text-sm text-gray-500 mt-1">{c.subtitle}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {canViewDonsData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dons par type</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={donsByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total" name="Montant total" fill="#135796" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cotisations encaissées par type</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cotisationsByTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="total" name="Montant total" fill="#9C5931" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {canViewDepensesData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dépenses par type</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={depensesByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total" name="Montant total" fill="#1E6EC0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sanctions par type</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sanctionsByTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="total" name="Montant total" fill="#9BA9A1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {canViewDonsData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Derniers dons</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={recentDonsColumns}
                data={recentDonsQuery.data || []}
                loading={recentDonsQuery.isLoading}
                emptyMessage="Aucun don trouvé"
              />
            </CardContent>
          </Card>
        )}

        {canViewDepensesData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dernières dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={recentDepensesColumns}
                data={recentDepensesQuery.data || []}
                loading={recentDepensesQuery.isLoading}
                emptyMessage="Aucune dépense trouvée"
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dernières sanctions</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={recentSanctionsColumns}
              data={recentSanctionsQuery.data || []}
              loading={recentSanctionsQuery.isLoading}
              emptyMessage="Aucune sanction trouvée"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Réunions à venir</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={upcomingReunionsColumns}
              data={upcomingReunionsQuery.data || []}
              loading={upcomingReunionsQuery.isLoading}
              emptyMessage="Aucune réunion à venir"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
