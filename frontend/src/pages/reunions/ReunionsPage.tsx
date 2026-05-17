import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Plus, Search, Users, CheckCircle2, XCircle, Clock, Save, Eye, Pencil, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import DataTable from '@/components/shared/DataTable'
import { reunionsApi, participantsApi, structuresApi } from '@/services/api/users'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { getActiveStructureIds, hasActiveStatut, isReadonlyMember, isSuperAdmin } from '@/lib/access'
import { toast } from '@/components/ui/sonner'

type ActiveTab = 'list' | 'participants'

export default function ReunionsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('list')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'generale' | 'structure'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'canceled'>('all')
  const [filterStructureId, setFilterStructureId] = useState<number | undefined>(undefined)
  const [selectedReunion, setSelectedReunion] = useState<number | undefined>(undefined)
  const [myStatus, setMyStatus] = useState<'pending' | 'present' | 'absent'>('pending')
  const [myComment, setMyComment] = useState<string>('')
  const [participantEdits, setParticipantEdits] = useState<Record<number, { status: 'pending' | 'present' | 'absent'; comment: string }>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [createType, setCreateType] = useState<'generale' | 'structure'>('generale')
  const [createStructureId, setCreateStructureId] = useState<number | undefined>(undefined)
  const [libelle, setLibelle] = useState('')
  const [description, setDescription] = useState('')
  const [dateReunion, setDateReunion] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [lieu, setLieu] = useState('')
  const [points, setPoints] = useState('')
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsItem, setDetailsItem] = useState<any | undefined>(undefined)
  const [isPvDownloading, setIsPvDownloading] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | undefined>(undefined)
  const [editType, setEditType] = useState<'generale' | 'structure'>('generale')
  const [editStructureId, setEditStructureId] = useState<number | undefined>(undefined)
  const [editLibelle, setEditLibelle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDateReunion, setEditDateReunion] = useState('')
  const [editHeureDebut, setEditHeureDebut] = useState('')
  const [editHeureFin, setEditHeureFin] = useState('')
  const [editLieu, setEditLieu] = useState('')
  const [editPoints, setEditPoints] = useState('')
  const [editProcesVerbal, setEditProcesVerbal] = useState('')
  const [editStatus, setEditStatus] = useState<'pending' | 'completed' | 'canceled'>('pending')
  const [editInitialStatus, setEditInitialStatus] = useState<'pending' | 'completed' | 'canceled'>('pending')
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [completeId, setCompleteId] = useState<number | undefined>(undefined)
  const [completeLibelle, setCompleteLibelle] = useState('')
  const [completeProcesVerbal, setCompleteProcesVerbal] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | undefined>(undefined)
  const [deleteTitle, setDeleteTitle] = useState('')
  const [deleteSubtitle, setDeleteSubtitle] = useState('')

  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const memberReadonly = isReadonlyMember(user)
  const canSetPresent = isSuperAdmin(user) || hasActiveStatut(user)
  const isMember = user?.role === 'membre'
  const activeStructureIds = getActiveStructureIds(user)
  const memberStructureId = isMember ? activeStructureIds[0] : undefined
  const canManageRow = (item: any) => {
    if (!user) return false
    if (isSuperAdmin(user)) return true
    if (user.role === 'admin') return hasActiveStatut(user)
    if (user.role === 'membre') return hasActiveStatut(user) && item?.type === 'structure' && activeStructureIds.includes(item?.structure_id)
    return false
  }

  useEffect(() => {
    if (isMember) {
      setCreateType('structure')
      if (createStructureId === undefined && memberStructureId !== undefined) setCreateStructureId(memberStructureId)
    }
  }, [createStructureId, isMember, memberStructureId])

  const reunionsQuery = useQuery({
    queryKey: ['reunions', { search, type: filterType, status: filterStatus, structure_id: filterStructureId }],
    queryFn: async () => {
      const response = await reunionsApi.getReunions({
        search,
        type: filterType === 'all' ? undefined : filterType,
        status: filterStatus === 'all' ? undefined : filterStatus,
        structure_id: isMember ? undefined : filterStructureId,
        per_page: 20,
      })
      return response.data.data?.data || []
    },
  })

  const participantsQuery = useQuery({
    queryKey: ['participants', { reunionId: selectedReunion }],
    queryFn: async () => {
      const response = await participantsApi.getParticipants({ reunion_id: selectedReunion, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: !!selectedReunion,
  })

  const reunions = reunionsQuery.data || []
  const participants = participantsQuery.data || []
  const totalReunions = reunions.length
  const pendingReunions = reunions.filter((r: any) => r?.status === 'pending').length
  const completedReunions = reunions.filter((r: any) => r?.status === 'completed').length
  const canceledReunions = reunions.filter((r: any) => r?.status === 'canceled').length
  const myParticipant = user ? participants.find((p: any) => p.user_id === user.id) : undefined
  const selectedReunionItem = selectedReunion ? reunions.find((r: any) => r.id === selectedReunion) : undefined
  const canEditParticipants = !!selectedReunionItem && canSetPresent && canManageRow(selectedReunionItem)
  const isSelectedGenerale = selectedReunionItem?.type === 'generale'

  const getApiErrorMessage = (error: any) => {
    const payload = error?.response?.data
    const raw = payload?.error?.error ?? payload?.message ?? payload?.error
    if (typeof raw === 'string') return raw
    if (Array.isArray(raw)) return raw[0]
    if (raw && typeof raw === 'object') {
      for (const v of Object.values(raw)) {
        if (Array.isArray(v) && v[0]) return v[0]
        if (typeof v === 'string') return v
      }
    }
    return 'Erreur lors de la mise à jour'
  }

  const downloadProcesVerbalPdf = async (item: any) => {
    if (!item?.id) return
    try {
      setIsPvDownloading(true)
      const response = await reunionsApi.downloadProcesVerbalPdf(item.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const safeName = String(item?.libelle || 'proces-verbal')
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .slice(0, 80)

      const a = document.createElement('a')
      a.href = url
      a.download = `${safeName || 'proces-verbal'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      const maybeBlob = error?.response?.data
      if (maybeBlob instanceof Blob) {
        try {
          const text = await maybeBlob.text()
          const parsed = JSON.parse(text)
          const rawMsg = parsed?.error?.error ?? parsed?.message ?? parsed?.error
          const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg
          toast.error(msg || 'Erreur lors du téléchargement')
        } catch {
          toast.error('Erreur lors du téléchargement')
        }
      } else {
        toast.error(getApiErrorMessage(error))
      }
    } finally {
      setIsPvDownloading(false)
    }
  }

  const updateMyParticipantMutation = useMutation({
    mutationFn: (payload: { participantId: number; status?: 'pending' | 'present' | 'absent'; comment?: string }) =>
      participantsApi.updateParticipant(payload.participantId, { status: payload.status, comment: payload.comment }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        queryClient.invalidateQueries({ queryKey: ['participants'] })
        setParticipantEdits({})
      } else {
        const rawMsg = result?.error?.error || result?.message
        const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg
        toast.error(msg || 'Erreur lors de la mise à jour')
      }
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const structuresQuery = useQuery({
    queryKey: ['structures', { for: 'reunions' }],
    queryFn: async () => {
      const response = await structuresApi.getStructures({ is_active: true, per_page: 200 })
      return response.data.data?.data || []
    },
    enabled: !isMember,
  })

  const createReunionMutation = useMutation({
    mutationFn: () =>
      reunionsApi.createReunion({
        type: isMember ? 'structure' : createType,
        structure_id: (isMember ? memberStructureId : createType === 'structure' ? createStructureId : undefined) || undefined,
        libelle,
        description: description || undefined,
        date_reunion: dateReunion,
        heure_debut: heureDebut,
        heure_fin: heureFin,
        lieu: lieu || undefined,
        points_reunion: points
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Réunion créée avec succès')
        queryClient.invalidateQueries({ queryKey: ['reunions'] })
        setShowCreate(false)
        setLibelle('')
        setDescription('')
        setDateReunion('')
        setHeureDebut('')
        setHeureFin('')
        setLieu('')
        setPoints('')
      } else {
        toast.error(result.message || 'Erreur lors de la création')
      }
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const updateReunionMutation = useMutation({
    mutationFn: () =>
      reunionsApi.updateReunion(editId!, {
        type: isMember ? 'structure' : editType,
        structure_id: (isMember ? memberStructureId : editType === 'structure' ? editStructureId : undefined) || undefined,
        libelle: editLibelle,
        description: editDescription || undefined,
        date_reunion: editDateReunion,
        heure_debut: editHeureDebut,
        heure_fin: editHeureFin,
        lieu: editLieu || undefined,
        points_reunion: editPoints
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
        proces_verbal: editProcesVerbal
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
        status: editStatus,
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Réunion mise à jour avec succès')
        queryClient.invalidateQueries({ queryKey: ['reunions'] })
        setIsEditOpen(false)
        setEditId(undefined)
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const updateReunionStatusMutation = useMutation({
    mutationFn: (payload: { id: number; status: 'pending' | 'completed' | 'canceled' }) =>
      reunionsApi.updateReunion(payload.id, { status: payload.status }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success(result.message || 'Statut mis à jour')
        queryClient.invalidateQueries({ queryKey: ['reunions'] })
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const completeReunionMutation = useMutation({
    mutationFn: () =>
      reunionsApi.updateReunion(completeId!, {
        status: 'completed',
        proces_verbal: completeProcesVerbal
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
      }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success(result.message || 'Réunion terminée')
        queryClient.invalidateQueries({ queryKey: ['reunions'] })
        setIsCompleteOpen(false)
        setCompleteId(undefined)
        setCompleteLibelle('')
        setCompleteProcesVerbal('')
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: (error: any) => {
      const payload = error?.response?.data
      const rawMsg = payload?.error?.proces_verbal || payload?.error?.error || payload?.message
      const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg
      toast.error(msg || 'Le procès-verbal est obligatoire.')
    },
  })

  const deleteReunionMutation = useMutation({
    mutationFn: (id: number) => reunionsApi.deleteReunion(id),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success(result.message || 'Réunion supprimée')
        queryClient.invalidateQueries({ queryKey: ['reunions'] })
        setIsDeleteOpen(false)
        setDeleteId(undefined)
        setDeleteTitle('')
        setDeleteSubtitle('')
      } else {
        toast.error(result.message || 'Erreur lors de la suppression')
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message
      toast.error(msg || 'Erreur lors de la suppression')
    },
  })

  const openDetails = (item: any) => {
    setDetailsItem(item)
    setIsDetailsOpen(true)
  }

  const openEdit = (item: any) => {
    setEditId(item.id)
    setEditType(item.type || 'generale')
    setEditStructureId(item.structure_id ?? undefined)
    setEditLibelle(item.libelle || '')
    setEditDescription(item.description || '')
    setEditDateReunion(item.date_reunion || '')
    setEditHeureDebut((item.heure_debut || '').slice(0, 5))
    setEditHeureFin((item.heure_fin || '').slice(0, 5))
    setEditLieu(item.lieu || '')
    setEditPoints(Array.isArray(item.points_reunion) ? item.points_reunion.join('\n') : '')
    setEditProcesVerbal(Array.isArray(item.proces_verbal) ? item.proces_verbal.join('\n') : '')
    setEditStatus(item.status || 'pending')
    setEditInitialStatus(item.status || 'pending')
    setIsEditOpen(true)
  }

  const openComplete = (item: any) => {
    setCompleteId(item.id)
    setCompleteLibelle(item.libelle || '')
    setCompleteProcesVerbal(Array.isArray(item.proces_verbal) ? item.proces_verbal.join('\n') : '')
    setIsCompleteOpen(true)
  }

  const openDelete = (item: any) => {
    setDeleteId(item.id)
    setDeleteTitle('Supprimer la réunion ?')
    setDeleteSubtitle(item?.libelle || '')
    setIsDeleteOpen(true)
  }

  const syncMyParticipationForm = (participant: any) => {
    if (!participant) return
    setMyStatus(participant.status || 'pending')
    setMyComment(participant.comment || '')
  }

  useEffect(() => {
    if (myParticipant) syncMyParticipationForm(myParticipant)
  }, [myParticipant])

  useEffect(() => {
    if (isSelectedGenerale) setMyStatus('absent')
  }, [isSelectedGenerale])

  useEffect(() => {
    if (!selectedReunion) return
    if (!participants.length) return
    setParticipantEdits((prev) => {
      if (Object.keys(prev).length > 0) return prev
      const next: Record<number, { status: 'pending' | 'present' | 'absent'; comment: string }> = {}
      for (const p of participants) {
        next[p.id] = {
          status: (p.status as 'pending' | 'present' | 'absent') || 'pending',
          comment: p.comment || '',
        }
      }
      return next
    })
  }, [participants, selectedReunion])

  const getReunionStatus = (reunion: any) => {
    const status = reunion.status as 'pending' | 'completed' | 'canceled'
    if (status === 'completed') return { label: 'Terminée', variant: 'success' as const }
    if (status === 'canceled') return { label: 'Annulée', variant: 'destructive' as const }
    return { label: 'En attente', variant: 'warning' as const }
  }

  const getParticipantStatus = (status: string) => {
    switch (status) {
      case 'present':
        return { label: 'Présent', variant: 'success' as const, icon: <CheckCircle2 className="w-3 h-3 mr-1" /> }
      case 'absent':
        return { label: 'Absent', variant: 'destructive' as const, icon: <XCircle className="w-3 h-3 mr-1" /> }
      default:
        return { label: 'En attente', variant: 'warning' as const, icon: <Clock className="w-3 h-3 mr-1" /> }
    }
  }

  const reunionColumns = [
    {
      key: 'libelle',
      header: 'Intitulé',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.libelle}</p>
            {item.description && (
              <p className="text-sm text-gray-500">{item.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'date_reunion',
      header: 'Date',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          {formatDate(item.date_reunion)}
        </div>
      ),
    },
    {
      key: 'heure',
      header: 'Horaire',
      cell: (item: any) => (
        <span className="text-sm text-gray-700">
          {item.heure_debut?.slice(0, 5)} - {item.heure_fin?.slice(0, 5)}
        </span>
      ),
    },
    {
      key: 'lieu',
      header: 'Lieu',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          {item.lieu || 'À définir'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (item: any) => {
        const { label, variant } = getReunionStatus(item)
        return <Badge variant={variant}>{label}</Badge>
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openDetails(item)} title="Détails">
            <Eye className="w-4 h-4 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setActiveTab('participants')
              setSelectedReunion(item.id)
              setParticipantEdits({})
              setTimeout(() => {
                const p = user ? item.participants?.find((pp: any) => pp.user_id === user.id) : undefined
                if (p) syncMyParticipationForm(p)
              }, 0)
            }}
            title="Voir les participants"
          >
            <Users className="w-4 h-4 text-primary" />
          </Button>
          {canManageRow(item) && (
            <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Modifier">
              <Pencil className="w-4 h-4 text-gray-500" />
            </Button>
          )}
          {canManageRow(item) && item.status === 'pending' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openComplete(item)}
              title="Marquer terminée"
              disabled={completeReunionMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4 text-gray-500" />
            </Button>
          )}
          {canManageRow(item) && item.status === 'pending' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateReunionStatusMutation.mutate({ id: item.id, status: 'canceled' })}
              title="Annuler"
              disabled={updateReunionStatusMutation.isPending}
            >
              <XCircle className="w-4 h-4 text-gray-500" />
            </Button>
          )}
          {canManageRow(item) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openDelete(item)}
              title={item.status === 'canceled' ? 'Supprimer' : 'Supprimer (annuler d\'abord)'}
              disabled={item.status !== 'canceled'}
            >
              <Trash2 className="w-4 h-4 text-gray-500" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const participantColumns = [
    {
      key: 'user',
      header: 'Membre',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={item.user?.avatar_url} alt={item.user?.full_name || 'Avatar'} />
            <AvatarFallback className="bg-primary text-white font-heading">
              {(item.user?.full_name || 'NA')
                .split(' ')
                .filter(Boolean)
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
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
      key: 'status',
      header: 'Présence',
      cell: (item: any) => {
        if (canEditParticipants) {
          const value = participantEdits[item.id]?.status ?? (item.status as 'pending' | 'present' | 'absent') ?? 'pending'
          return (
            <select
              value={value}
              onChange={(e) => {
                const nextStatus = e.target.value as 'pending' | 'present' | 'absent'
                setParticipantEdits((prev) => ({
                  ...prev,
                  [item.id]: { status: nextStatus, comment: prev[item.id]?.comment ?? item.comment ?? '' },
                }))
              }}
              className="flex h-9 w-full max-w-[160px] rounded-lg border-2 border-gray-200 bg-white px-3 py-1 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
            >
              <option value="pending">En attente</option>
              <option value="present">Présent</option>
              <option value="absent">Absent</option>
            </select>
          )
        }

        const { label, variant, icon } = getParticipantStatus(item.status)
        return (
          <Badge variant={variant} className="flex items-center">
            {icon}
            {label}
          </Badge>
        )
      },
    },
    {
      key: 'comment',
      header: 'Commentaire',
      cell: (item: any) => {
        if (canEditParticipants) {
          const value = participantEdits[item.id]?.comment ?? item.comment ?? ''
          return (
            <Input
              value={value}
              onChange={(e) => {
                const nextComment = e.target.value
                setParticipantEdits((prev) => ({
                  ...prev,
                  [item.id]: { status: prev[item.id]?.status ?? (item.status as any) ?? 'pending', comment: nextComment },
                }))
              }}
              className="max-w-xs"
              placeholder="Commentaire..."
            />
          )
        }

        return (
          <span className="text-sm text-gray-600 max-w-xs truncate" title={item.comment || ''}>
            {item.comment ? item.comment : <span className="text-gray-400 italic">Commentaire...</span>}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      cell: (item: any) => {
        if (!canEditParticipants) return null
        const draft = participantEdits[item.id]
        const status = draft?.status ?? (item.status as 'pending' | 'present' | 'absent') ?? 'pending'
        const comment = (draft?.comment ?? item.comment ?? '').trim()
        const isSame = status === item.status && (comment || '') === ((item.comment || '') as string).trim()
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              updateMyParticipantMutation.mutate({
                participantId: item.id,
                status,
                comment: comment ? comment : '',
              })
            }}
            disabled={updateMyParticipantMutation.isPending || isSame}
          >
            {updateMyParticipantMutation.isPending ? '...' : 'Enregistrer'}
          </Button>
        )
      },
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <AnimatePresence>
        {isDetailsOpen && detailsItem && (
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
                        <h2 className="truncate text-lg font-semibold">Détails de la réunion</h2>
                        <p className="mt-0.5 truncate text-sm text-white/80">{detailsItem.libelle}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsDetailsOpen(false)
                      setDetailsItem(undefined)
                    }}
                    className="text-white hover:bg-white/15 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="max-h-[75vh] overflow-auto p-6">
                {(() => {
                  const { label, variant } = getReunionStatus(detailsItem)
                  const participantsList = Array.isArray(detailsItem.participants) ? detailsItem.participants : []
                  const presentCount = participantsList.filter((p: any) => p.status === 'present').length
                  const absentCount = participantsList.filter((p: any) => p.status === 'absent').length
                  const pendingCount = participantsList.filter((p: any) => p.status === 'pending').length

                  return (
                    <div className="space-y-6">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border bg-gray-50 p-4">
                          <p className="text-xs font-medium text-gray-600">Date</p>
                          <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(detailsItem.date_reunion)}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {(detailsItem.heure_debut || '').slice(0, 5)} - {(detailsItem.heure_fin || '').slice(0, 5)}
                          </p>
                        </div>
                        <div className="rounded-xl border bg-blue-50 p-4">
                          <p className="text-xs font-medium text-blue-700">Participants</p>
                          <p className="mt-1 text-lg font-semibold text-blue-900">{participantsList.length}</p>
                          <p className="mt-1 text-xs text-blue-700">{detailsItem.type === 'generale' ? 'Générale' : 'Structure'}</p>
                        </div>
                        <div className="rounded-xl border bg-white p-4">
                          <p className="text-xs font-medium text-gray-600">Statut</p>
                          <div className="mt-2">
                            <Badge variant={variant}>{label}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">{detailsItem.lieu || 'À définir'}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500">Type</p>
                          <p className="mt-1 font-semibold text-gray-900">{detailsItem.type === 'generale' ? 'Générale' : 'Structure'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Structure</p>
                          <p className="mt-1 font-semibold text-gray-900">{detailsItem.structure?.libelle || '-'}</p>
                        </div>
                      </div>

                      {detailsItem.description && (
                        <div className="rounded-xl border p-4">
                          <p className="text-xs font-medium text-gray-500">Description</p>
                          <p className="mt-2 text-sm text-gray-900">{detailsItem.description}</p>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border bg-emerald-50 p-4">
                          <p className="text-xs font-medium text-emerald-700">Présents</p>
                          <p className="mt-1 text-lg font-semibold text-emerald-900">{presentCount}</p>
                        </div>
                        <div className="rounded-xl border bg-rose-50 p-4">
                          <p className="text-xs font-medium text-rose-700">Absents</p>
                          <p className="mt-1 text-lg font-semibold text-rose-900">{absentCount}</p>
                        </div>
                        <div className="rounded-xl border bg-amber-50 p-4">
                          <p className="text-xs font-medium text-amber-700">En attente</p>
                          <p className="mt-1 text-lg font-semibold text-amber-900">{pendingCount}</p>
                        </div>
                      </div>

                      {Array.isArray(detailsItem.points_reunion) && detailsItem.points_reunion.length > 0 && (
                        <div className="rounded-xl border p-4">
                          <p className="text-xs font-medium text-gray-500">Points</p>
                          <ul className="mt-2 space-y-2 text-sm text-gray-900">
                            {detailsItem.points_reunion.map((p: string, idx: number) => (
                              <li key={idx} className="flex gap-2">
                                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#135796]" />
                                <span className="min-w-0">{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="rounded-xl border p-4">
                        <p className="text-xs font-medium text-gray-500">Procès-verbal</p>
                        {Array.isArray(detailsItem.proces_verbal) && detailsItem.proces_verbal.length > 0 ? (
                          <ul className="mt-2 space-y-2 text-sm text-gray-900">
                            {detailsItem.proces_verbal.map((p: string, idx: number) => (
                              <li key={idx} className="flex gap-2">
                                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                                <span className="min-w-0">{p}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-gray-500">Aucun procès-verbal.</p>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false)
                    setDetailsItem(undefined)
                  }}
                >
                  Fermer
                </Button>
                <div className="flex items-center gap-2">
                  {detailsItem?.status === 'completed' && Array.isArray(detailsItem?.proces_verbal) && detailsItem.proces_verbal.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => downloadProcesVerbalPdf(detailsItem)}
                      disabled={isPvDownloading}
                    >
                      {isPvDownloading ? 'Téléchargement...' : 'Télécharger PV (PDF)'}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setActiveTab('participants')
                      setSelectedReunion(detailsItem.id)
                      setParticipantEdits({})
                      setIsDetailsOpen(false)
                      setDetailsItem(undefined)
                    }}
                  >
                    Voir les participants
                  </Button>
                </div>
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
                        <h2 className="truncate text-lg font-semibold">Modifier la réunion</h2>
                        <p className="mt-0.5 truncate text-sm text-white/80">{editLibelle || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsEditOpen(false)
                      setEditId(undefined)
                    }}
                    className="text-white hover:bg-white/15 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="max-h-[75vh] overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!isMember && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type *</label>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as any)}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                      >
                        <option value="generale">Générale</option>
                        <option value="structure">Structure</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Structure</label>
                    {isMember ? (
                      <Input value={user?.assign_structures?.find((s) => s.is_active)?.structure?.libelle || 'Ma structure'} disabled />
                    ) : (
                      <select
                        value={editStructureId ?? ''}
                        onChange={(e) => setEditStructureId(e.target.value ? Number(e.target.value) : undefined)}
                        disabled={editType !== 'structure'}
                        className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2 disabled:bg-gray-100"
                      >
                        <option value="">Sélectionner...</option>
                        {(structuresQuery.data || []).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.libelle}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Libellé *</label>
                    <Input value={editLibelle} onChange={(e) => setEditLibelle(e.target.value)} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date *</label>
                    <Input type="date" value={editDateReunion} onChange={(e) => setEditDateReunion(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lieu</label>
                    <Input value={editLieu} onChange={(e) => setEditLieu(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Heure début *</label>
                    <Input type="time" value={editHeureDebut} onChange={(e) => setEditHeureDebut(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Heure fin *</label>
                    <Input type="time" value={editHeureFin} onChange={(e) => setEditHeureFin(e.target.value)} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Points (1 ligne = 1 point)</label>
                    <textarea
                      value={editPoints}
                      onChange={(e) => setEditPoints(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Procès-verbal (1 ligne = 1 point)</label>
                    <textarea
                      value={editProcesVerbal}
                      onChange={(e) => setEditProcesVerbal(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    />
                    {editStatus === 'completed' && !editProcesVerbal.trim() && (
                      <p className="text-xs text-red-600">Le procès-verbal est obligatoire pour terminer la réunion.</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Statut</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    >
                      <option value="pending">En attente</option>
                      <option value="completed">Terminée</option>
                      <option value="canceled" disabled={editInitialStatus !== 'pending'}>Annulée</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditOpen(false)
                    setEditId(undefined)
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => updateReunionMutation.mutate()}
                  disabled={
                    !editId ||
                    !editLibelle ||
                    !editDateReunion ||
                    !editHeureDebut ||
                    !editHeureFin ||
                    (editStatus === 'completed' && !editProcesVerbal.trim()) ||
                    (!isMember && editType === 'structure' && !editStructureId) ||
                    updateReunionMutation.isPending
                  }
                >
                  {updateReunionMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCompleteOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">Terminer la réunion</h2>
                        <p className="mt-0.5 truncate text-sm text-white/80">{completeLibelle || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsCompleteOpen(false)
                      setCompleteId(undefined)
                      setCompleteLibelle('')
                      setCompleteProcesVerbal('')
                    }}
                    className="text-white hover:bg-white/15 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="max-h-[75vh] overflow-auto p-6">
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                    Pour marquer la réunion comme terminée, le procès-verbal est obligatoire.
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Procès-verbal (1 ligne = 1 point)</label>
                    <textarea
                      value={completeProcesVerbal}
                      onChange={(e) => setCompleteProcesVerbal(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 focus-visible:ring-offset-2"
                      placeholder="Ex:\nLecture du PV précédent\nBudget\nDivers"
                    />
                    {!completeProcesVerbal.trim() && (
                      <p className="text-xs text-red-600">Le procès-verbal est obligatoire pour terminer la réunion.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCompleteOpen(false)
                    setCompleteId(undefined)
                    setCompleteLibelle('')
                    setCompleteProcesVerbal('')
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => completeReunionMutation.mutate()}
                  disabled={!completeId || !completeProcesVerbal.trim() || completeReunionMutation.isPending}
                >
                  {completeReunionMutation.isPending ? 'Terminaison...' : 'Terminer'}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsDeleteOpen(false)
                      setDeleteId(undefined)
                      setDeleteTitle('')
                      setDeleteSubtitle('')
                    }}
                    className="text-white hover:bg-white/15 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                  Cette action est irréversible.
                </div>
              </div>

              <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteOpen(false)
                    setDeleteId(undefined)
                    setDeleteTitle('')
                    setDeleteSubtitle('')
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!deleteId) return
                    deleteReunionMutation.mutate(deleteId)
                  }}
                  disabled={deleteReunionMutation.isPending || !deleteId}
                >
                  {deleteReunionMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-darkslate mb-2">Réunions</h1>
          <p className="text-gray-600">Gérez les réunions et les présences</p>
        </div>
        {activeTab === 'list' && !memberReadonly && (
          <Button onClick={() => setShowCreate((v) => !v)}>
            <Plus className="w-4 h-4 mr-2" />
            {showCreate ? 'Fermer' : 'Planifier une réunion'}
          </Button>
        )}
      </div>

      {activeTab === 'list' && showCreate && !memberReadonly && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Nouvelle réunion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isMember && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type *</label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value as any)}
                    className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                  >
                    <option value="generale">Générale</option>
                    <option value="structure">Structure</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Structure</label>
                {isMember ? (
                  <Input value={user?.assign_structures?.find((s) => s.is_active)?.structure?.libelle || 'Ma structure'} disabled />
                ) : (
                  <select
                    value={createStructureId ?? ''}
                    onChange={(e) => setCreateStructureId(e.target.value ? Number(e.target.value) : undefined)}
                    disabled={createType !== 'structure'}
                    className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2 disabled:bg-gray-100"
                  >
                    <option value="">Sélectionner...</option>
                    {(structuresQuery.data || []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.libelle}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Libellé *</label>
                <Input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Ex: Réunion mensuelle" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input type="date" value={dateReunion} onChange={(e) => setDateReunion(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lieu</label>
                <Input value={lieu} onChange={(e) => setLieu(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Heure début *</label>
                <Input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Heure fin *</label>
                <Input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Points (1 ligne = 1 point)</label>
                <textarea
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => createReunionMutation.mutate()}
                disabled={
                  !libelle ||
                  !dateReunion ||
                  !heureDebut ||
                  !heureFin ||
                  (!isMember && createType === 'structure' && !createStructureId) ||
                  createReunionMutation.isPending
                }
              >
                {createReunionMutation.isPending ? 'Création...' : 'Créer la réunion'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'list' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('list')
            setSelectedReunion(undefined)
          }}
          className="rounded-none"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Réunions
        </Button>
        <Button
          variant={activeTab === 'participants' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('participants')}
          className="rounded-none"
          disabled={!selectedReunion && activeTab !== 'participants'}
        >
          <Users className="w-4 h-4 mr-2" />
          Participants
        </Button>
      </div>

      {activeTab === 'participants' && selectedReunion && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setActiveTab('list')
              setSelectedReunion(undefined)
            }}
          >
            <Search className="w-4 h-4" />
          </Button>
          <p className="text-sm text-gray-600">
            Affichage des participants pour:{' '}
            <span className="font-medium">
              {reunions.find((r: any) => r.id === selectedReunion)?.libelle}
            </span>
          </p>
        </div>
      )}

      {activeTab === 'participants' && selectedReunion && myParticipant && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ma participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <select
                  value={memberReadonly || isSelectedGenerale ? 'absent' : myStatus}
                  onChange={(e) => setMyStatus(e.target.value as any)}
                  disabled={memberReadonly || isSelectedGenerale}
                  className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2 disabled:bg-gray-100"
                >
                  <option value="pending">En attente</option>
                  <option value="absent">Absent</option>
                  <option value="present" disabled={!canSetPresent}>Présent</option>
                </select>
                {!canSetPresent && (
                  <p className="text-xs text-gray-500">
                    Seuls les utilisateurs avec statut peuvent marquer la présence.
                  </p>
                )}
                {isSelectedGenerale && (
                  <p className="text-xs text-gray-500">
                    Pour une réunion générale, vous pouvez uniquement marquer votre absence.
                  </p>
                )}
                {memberReadonly && (
                  <p className="text-xs text-gray-500">
                    Sans statut actif, vous pouvez uniquement marquer votre absence.
                  </p>
                )}
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Commentaire</label>
                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                  placeholder="Motif d'absence, remarque..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  updateMyParticipantMutation.mutate({
                    participantId: myParticipant.id,
                    status: memberReadonly || isSelectedGenerale ? 'absent' : myStatus,
                    comment: myComment,
                  })
                }}
                disabled={updateMyParticipantMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMyParticipantMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">
              {activeTab === 'list' ? 'Toutes les réunions' : 'Participants'}
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

              {activeTab === 'list' && (
                <>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="flex h-10 w-full sm:w-44 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                  >
                    <option value="all">Tous types</option>
                    <option value="generale">Générale</option>
                    <option value="structure">Structure</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="flex h-10 w-full sm:w-44 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="pending">En cours</option>
                    <option value="completed">Terminée</option>
                    <option value="canceled">Annulée</option>
                  </select>

                  {!isMember && (
                    <select
                      value={filterStructureId ?? ''}
                      onChange={(e) => setFilterStructureId(e.target.value ? Number(e.target.value) : undefined)}
                      className="flex h-10 w-full sm:w-52 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                    >
                      <option value="">Toutes structures</option>
                      {(structuresQuery.data || []).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.libelle}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'list' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#135796]">{totalReunions}</div>
                    <p className="text-xs text-gray-500 mt-1">Réunions</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">En cours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#1E6EC0]">{pendingReunions}</div>
                    <p className="text-xs text-gray-500 mt-1">À venir</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Terminées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#9C5931]">{completedReunions}</div>
                    <p className="text-xs text-gray-500 mt-1">Clôturées</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Annulées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#9BA9A1]">{canceledReunions}</div>
                    <p className="text-xs text-gray-500 mt-1">Annulations</p>
                  </CardContent>
                </Card>
              </div>

              <DataTable
                columns={reunionColumns}
                data={reunions}
                loading={reunionsQuery.isLoading}
                emptyMessage="Aucune réunion trouvée"
                rowClassName={(item: any) => {
                  if (item?.status === 'completed') return ''
                  if (item?.type === 'generale') return 'bg-blue-50 hover:bg-blue-100 transition-colors'
                  if (item?.type === 'structure') return 'bg-emerald-50 hover:bg-emerald-100 transition-colors'
                  return ''
                }}
              />
            </div>
          ) : (
            <DataTable
              columns={participantColumns}
              data={participants}
              loading={participantsQuery.isLoading}
              rowClassName={(item: any) => {
                const status = item?.status as 'pending' | 'present' | 'absent'
                if (status === 'present') return 'bg-emerald-50 hover:bg-emerald-100 transition-colors'
                if (status === 'absent') return 'bg-rose-50 hover:bg-rose-100 transition-colors'
                return 'bg-yellow-50 hover:bg-yellow-100 transition-colors'
              }}
              emptyMessage={
                selectedReunion
                  ? 'Aucun participant trouvé'
                  : 'Veuillez sélectionner une réunion pour voir les participants'
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
