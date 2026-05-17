import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building,
  UserCheck,
  Plus,
  Search,
  DollarSign,
  Pencil,
  Trash2,
  Power,
} from 'lucide-react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import DataTable from '@/components/shared/DataTable'
import {
  structuresApi,
  statutsApi,
  typeCotisationsApi,
} from '@/services/api/users'
import type { Structure, Statut } from '@/types/user'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { canManageSettings } from '@/lib/access'
import { toast } from '@/components/ui/sonner'

type ActiveTab =
  | 'structures'
  | 'statuts'
  | 'type_cotisations'

export default function StructuresPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('structures')
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [createLibelle, setCreateLibelle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createIsActive, setCreateIsActive] = useState(true)
  const [createAdresse, setCreateAdresse] = useState('')
  const [createDateCreation, setCreateDateCreation] = useState('')
  const [createContact, setCreateContact] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createLogo, setCreateLogo] = useState<File | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTab, setEditTab] = useState<ActiveTab | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ tab: ActiveTab; id: number; label: string } | null>(null)
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
              La gestion des paramètres nécessite un statut actif et des droits administrateur.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const structuresQuery = useQuery({
    queryKey: ['structures', { search }],
    queryFn: async () => {
      const response = await structuresApi.getStructures({ search, per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const statutsQuery = useQuery({
    queryKey: ['statuts', { search }],
    queryFn: async () => {
      const response = await statutsApi.getStatuts({ search, per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const typeCotisationsQuery = useQuery({
    queryKey: ['type_cotisations', { search }],
    queryFn: async () => {
      const response = await typeCotisationsApi.getTypeCotisations({ search, per_page: 200 })
      return response.data.data?.data || []
    },
  })

  const structures = structuresQuery.data || []
  const statuts = statutsQuery.data || []
  const typeCotisations = typeCotisationsQuery.data || []

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

  const openEdit = (tab: ActiveTab, item: any) => {
    setEditErrors({})
    setEditTab(tab)
    setEditId(item.id)
    setIsCreateOpen(false)

    if (tab === 'structures') {
      setCreateLibelle(item.libelle || '')
      setCreateDescription(item.description || '')
      setCreateAdresse(item.adresse || '')
      setCreateDateCreation(item.date_creation || '')
      setCreateContact(item.contact || '')
      setCreateEmail(item.email || '')
      setCreateLogo(null)
      setCreateIsActive(!!item.is_active)
    } else if (tab === 'statuts' || tab === 'type_cotisations') {
      setCreateLibelle(item.libelle || '')
      setCreateDescription(item.description || '')
      setCreateIsActive(!!item.is_active)
    }

    setIsEditOpen(true)
  }

  const closeEdit = () => {
    setIsEditOpen(false)
    setEditTab(null)
    setEditId(null)
    setEditErrors({})
  }

  const openDelete = (tab: ActiveTab, item: any) => {
    const label =
      tab === 'structures' || tab === 'statuts' || tab === 'type_cotisations'
        ? item.libelle
        : item.libelle

    setDeleteTarget({ tab, id: item.id, label })
    setIsDeleteOpen(true)
  }

  const closeDelete = () => {
    setIsDeleteOpen(false)
    setDeleteTarget(null)
  }

  const toggleActiveMutation = useMutation({
    mutationFn: (payload: { tab: ActiveTab; id: number; next: boolean }) => {
      switch (payload.tab) {
        case 'structures':
          return structuresApi.updateStructureActive(payload.id, payload.next)
        case 'statuts':
          return statutsApi.updateStatutActive(payload.id, payload.next)
        case 'type_cotisations':
          return typeCotisationsApi.updateTypeCotisationActive(payload.id, payload.next)
        default:
          return Promise.reject(new Error('Unsupported tab'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structures'] })
      queryClient.invalidateQueries({ queryKey: ['statuts'] })
      queryClient.invalidateQueries({ queryKey: ['type_cotisations'] })
      toast.success('Statut mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editTab || !editId) throw new Error('Missing edit target')

      if (editTab === 'structures') {
        const formData = new FormData()
        formData.append('libelle', createLibelle)
        if (createDescription) formData.append('description', createDescription)
        if (createAdresse) formData.append('adresse', createAdresse)
        if (createDateCreation) formData.append('date_creation', createDateCreation)
        if (createContact) formData.append('contact', createContact)
        if (createEmail) formData.append('email', createEmail)
        formData.append('is_active', createIsActive ? '1' : '0')
        if (createLogo) formData.append('logo', createLogo)
        return structuresApi.updateStructure(editId, formData)
      }

      if (editTab === 'statuts') {
        return statutsApi.updateStatut(editId, {
          libelle: createLibelle,
          description: createDescription || undefined,
          is_active: createIsActive,
        } as any)
      }

      if (editTab === 'type_cotisations') {
        return typeCotisationsApi.updateTypeCotisation(editId, {
          libelle: createLibelle,
          description: createDescription || undefined,
          is_active: createIsActive,
        })
      }

      throw new Error('Unsupported tab')
    },
    onSuccess: (response) => {
      const result = response.data
      if (result?.status === 1) {
        queryClient.invalidateQueries({ queryKey: ['structures'] })
        queryClient.invalidateQueries({ queryKey: ['statuts'] })
        queryClient.invalidateQueries({ queryKey: ['type_cotisations'] })
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
      switch (deleteTarget.tab) {
        case 'structures':
          return structuresApi.deleteStructure(deleteTarget.id)
        case 'statuts':
          return statutsApi.deleteStatut(deleteTarget.id)
        case 'type_cotisations':
          return typeCotisationsApi.deleteTypeCotisation(deleteTarget.id)
        default:
          return Promise.reject(new Error('Unsupported tab'))
      }
    },
    onSuccess: (response) => {
      const result = response.data
      if (result?.status === 1) {
        queryClient.invalidateQueries({ queryKey: ['structures'] })
        queryClient.invalidateQueries({ queryKey: ['statuts'] })
        queryClient.invalidateQueries({ queryKey: ['type_cotisations'] })
        toast.success(result.message || 'Suppression effectuée')
        closeDelete()
      } else {
        toast.error(result?.message || 'Erreur lors de la suppression')
      }
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const structureColumns = [
    {
      key: 'libelle',
      header: 'Nom',
      cell: (structure: Structure) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{structure.libelle}</p>
            {structure.description && (
              <p className="text-sm text-gray-500">{structure.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (structure: Structure) => (
        <div>
          {structure.contact && <p className="text-sm">{structure.contact}</p>}
          {structure.email && <p className="text-sm text-gray-500">{structure.email}</p>}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Statut',
      cell: (structure: Structure) => renderIsActiveBadge(!!structure.is_active),
    },
    {
      key: 'created_at',
      header: 'Date création',
      cell: (structure: Structure) => formatDate(structure.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (structure: Structure) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            title={structure.is_active ? 'Désactiver' : 'Activer'}
            onClick={() =>
              toggleActiveMutation.mutate({ tab: 'structures', id: structure.id, next: !structure.is_active })
            }
            disabled={toggleActiveMutation.isPending}
          >
            <Power className={`w-4 h-4 ${structure.is_active ? 'text-warning' : 'text-gray-400'}`} />
          </Button>
          <Button variant="ghost" size="icon" title="Modifier" onClick={() => openEdit('structures', structure)}>
            <Pencil className="w-4 h-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Supprimer" onClick={() => openDelete('structures', structure)}>
            <Trash2 className="w-4 h-4 text-error" />
          </Button>
        </div>
      ),
    },
  ]

  const statutColumns = [
    {
      key: 'libelle',
      header: 'Nom',
      cell: (statut: Statut) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <UserCheck className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{statut.libelle}</p>
            {statut.description && (
              <p className="text-sm text-gray-500">{statut.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Statut',
      cell: (statut: Statut) => renderIsActiveBadge(!!statut.is_active),
    },
    {
      key: 'created_at',
      header: 'Date création',
      cell: (statut: Statut) => formatDate(statut.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (statut: Statut) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            title={statut.is_active ? 'Désactiver' : 'Activer'}
            onClick={() => toggleActiveMutation.mutate({ tab: 'statuts', id: statut.id, next: !statut.is_active })}
            disabled={toggleActiveMutation.isPending}
          >
            <Power className={`w-4 h-4 ${statut.is_active ? 'text-warning' : 'text-gray-400'}`} />
          </Button>
          <Button variant="ghost" size="icon" title="Modifier" onClick={() => openEdit('statuts', statut)}>
            <Pencil className="w-4 h-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Supprimer" onClick={() => openDelete('statuts', statut)}>
            <Trash2 className="w-4 h-4 text-error" />
          </Button>
        </div>
      ),
    },
  ]

  const typeCotisationColumns = [
    {
      key: 'libelle',
      header: 'Nom',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-primary" />
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
      key: 'is_active',
      header: 'Statut',
      cell: (item: any) => renderIsActiveBadge(!!item.is_active),
    },
    {
      key: 'created_at',
      header: 'Date création',
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
            title={item.is_active ? 'Désactiver' : 'Activer'}
            onClick={() =>
              toggleActiveMutation.mutate({ tab: 'type_cotisations', id: item.id, next: !item.is_active })
            }
            disabled={toggleActiveMutation.isPending}
          >
            <Power className={`w-4 h-4 ${item.is_active ? 'text-warning' : 'text-gray-400'}`} />
          </Button>
          <Button variant="ghost" size="icon" title="Modifier" onClick={() => openEdit('type_cotisations', item)}>
            <Pencil className="w-4 h-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Supprimer" onClick={() => openDelete('type_cotisations', item)}>
            <Trash2 className="w-4 h-4 text-error" />
          </Button>
        </div>
      ),
    },
  ]

  const getCurrentTabInfo = () => {
    switch (activeTab) {
      case 'structures':
        return {
        data: structures,
        columns: structureColumns,
        loading: structuresQuery.isLoading,
        emptyMessage: 'Aucune structure trouvée',
        title: 'Toutes les structures',
        addLabel: 'Ajouter une structure',
      }
      case 'statuts':
        return {
        data: statuts,
        columns: statutColumns,
        loading: statutsQuery.isLoading,
        emptyMessage: 'Aucun statut trouvé',
        title: 'Tous les statuts',
        addLabel: 'Ajouter un statut',
      }
      case 'type_cotisations':
        return {
        data: typeCotisations,
        columns: typeCotisationColumns,
        loading: typeCotisationsQuery.isLoading,
        emptyMessage: 'Aucun type de cotisation trouvé',
        title: 'Types de cotisations',
        addLabel: 'Ajouter un type',
      }
      default:
        return {
        data: structures,
        columns: structureColumns,
        loading: structuresQuery.isLoading,
        emptyMessage: 'Aucune donnée trouvée',
        title: '',
        addLabel: '',
      }
    }
  }

  const currentTab = getCurrentTabInfo()
  const createTitle = currentTab.addLabel

  const closeCreate = () => {
    setIsCreateOpen(false)
    setCreateErrors({})
    setCreateLibelle('')
    setCreateDescription('')
    setCreateIsActive(true)
    setCreateAdresse('')
    setCreateDateCreation('')
    setCreateContact('')
    setCreateEmail('')
    setCreateLogo(null)
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      switch (activeTab) {
        case 'structures': {
          const formData = new FormData()
          formData.append('libelle', createLibelle)
          if (createDescription) formData.append('description', createDescription)
          if (createAdresse) formData.append('adresse', createAdresse)
          if (createDateCreation) formData.append('date_creation', createDateCreation)
          if (createContact) formData.append('contact', createContact)
          if (createEmail) formData.append('email', createEmail)
          formData.append('is_active', createIsActive ? '1' : '0')
          if (createLogo) formData.append('logo', createLogo)
          return structuresApi.createStructure(formData)
        }
        case 'statuts':
          return statutsApi.createStatut({
            libelle: createLibelle,
            description: createDescription || undefined,
            is_active: createIsActive,
          } as any)
        case 'type_cotisations':
          return typeCotisationsApi.createTypeCotisation({
            libelle: createLibelle,
            description: createDescription || undefined,
            is_active: createIsActive,
          })
        default:
          throw new Error('Unsupported tab')
      }
    },
    onSuccess: (response) => {
      const result = response.data
      if (result?.status === 1) {
        toast.success(result.message || 'Création réussie')
        closeCreate()
        queryClient.invalidateQueries({ queryKey: ['structures'] })
        queryClient.invalidateQueries({ queryKey: ['statuts'] })
        queryClient.invalidateQueries({ queryKey: ['type_cotisations'] })
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
              className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{createTitle}</h2>
              <Button variant="ghost" size="icon" onClick={closeCreate}>
                ✕
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Libellé *</label>
                <Input value={createLibelle} onChange={(e) => setCreateLibelle(e.target.value)} />
                {createErrors.libelle && <p className="text-sm text-red-500">{createErrors.libelle}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                />
                {createErrors.description && <p className="text-sm text-red-500">{createErrors.description}</p>}
              </div>

              {activeTab === 'structures' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Adresse</label>
                    <Input value={createAdresse} onChange={(e) => setCreateAdresse(e.target.value)} />
                    {createErrors.adresse && <p className="text-sm text-red-500">{createErrors.adresse}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date de création</label>
                    <Input type="date" value={createDateCreation} onChange={(e) => setCreateDateCreation(e.target.value)} />
                    {createErrors.date_creation && <p className="text-sm text-red-500">{createErrors.date_creation}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contact</label>
                      <Input value={createContact} onChange={(e) => setCreateContact(e.target.value)} />
                      {createErrors.contact && <p className="text-sm text-red-500">{createErrors.contact}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
                      {createErrors.email && <p className="text-sm text-red-500">{createErrors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo</label>
                    <Input
                      type="file"
                      accept="image/png,image/jpg,image/jpeg,image/svg+xml"
                      onChange={(e) => setCreateLogo(e.target.files?.[0] || null)}
                    />
                    {createErrors.logo && <p className="text-sm text-red-500">{createErrors.logo}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={createIsActive}
                      onChange={(e) => setCreateIsActive(e.target.checked)}
                      className="rounded border-gray-300"
                      id="createIsActive"
                    />
                    <label htmlFor="createIsActive" className="text-sm">Actif</label>
                  </div>
                </>
              )}

              {activeTab !== 'structures' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createIsActive}
                    onChange={(e) => setCreateIsActive(e.target.checked)}
                    className="rounded border-gray-300"
                    id="createIsActiveGeneric"
                  />
                  <label htmlFor="createIsActiveGeneric" className="text-sm">Actif</label>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeCreate}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    setCreateErrors({})
                    if (!createLibelle.trim()) {
                      setCreateErrors((prev) => ({ ...prev, libelle: 'Le libellé est obligatoire.' }))
                      return
                    }
                    createMutation.mutate()
                  }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Création...' : 'Créer'}
                </Button>
              </div>
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
              className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Modifier</h2>
                <Button variant="ghost" size="icon" onClick={closeEdit}>
                  ✕
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Libellé *</label>
                  <Input value={createLibelle} onChange={(e) => setCreateLibelle(e.target.value)} />
                  {editErrors.libelle && <p className="text-sm text-red-500">{editErrors.libelle}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                  />
                  {editErrors.description && <p className="text-sm text-red-500">{editErrors.description}</p>}
                </div>

                {editTab === 'structures' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Adresse</label>
                      <Input value={createAdresse} onChange={(e) => setCreateAdresse(e.target.value)} />
                      {editErrors.adresse && <p className="text-sm text-red-500">{editErrors.adresse}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date de création</label>
                      <Input type="date" value={createDateCreation} onChange={(e) => setCreateDateCreation(e.target.value)} />
                      {editErrors.date_creation && <p className="text-sm text-red-500">{editErrors.date_creation}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Contact</label>
                        <Input value={createContact} onChange={(e) => setCreateContact(e.target.value)} />
                        {editErrors.contact && <p className="text-sm text-red-500">{editErrors.contact}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
                        {editErrors.email && <p className="text-sm text-red-500">{editErrors.email}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Logo</label>
                      <Input
                        type="file"
                        accept="image/png,image/jpg,image/jpeg,image/svg+xml"
                        onChange={(e) => setCreateLogo(e.target.files?.[0] || null)}
                      />
                      {editErrors.logo && <p className="text-sm text-red-500">{editErrors.logo}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={createIsActive}
                        onChange={(e) => setCreateIsActive(e.target.checked)}
                        className="rounded border-gray-300"
                        id="createIsActiveEdit"
                      />
                      <label htmlFor="createIsActiveEdit" className="text-sm">Actif</label>
                    </div>
                  </>
                )}

                {editTab !== 'structures' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={createIsActive}
                      onChange={(e) => setCreateIsActive(e.target.checked)}
                      className="rounded border-gray-300"
                      id="createIsActiveGenericEdit"
                    />
                    <label htmlFor="createIsActiveGenericEdit" className="text-sm">Actif</label>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeEdit}>
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      setEditErrors({})
                      if (!createLibelle.trim()) {
                        setEditErrors((prev) => ({ ...prev, libelle: 'Le libellé est obligatoire.' }))
                        return
                      }
                      updateMutation.mutate()
                    }}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                  </Button>
                </div>
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
          <h1 className="font-heading text-h1 text-darkslate mb-2">Paramètres</h1>
          <p className="text-gray-600">Gérez les paramètres du syndicat</p>
        </div>
        <Button
          onClick={() => {
            setCreateErrors({})
            setIsCreateOpen(true)
          }}
          disabled={!currentTab.addLabel}
        >
          <Plus className="w-4 h-4 mr-2" />
          {currentTab.addLabel}
        </Button>
      </div>

      <div className="flex gap-2 border-b flex-wrap">
        <Button
          variant={activeTab === 'structures' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('structures')}
          className="rounded-none"
        >
          <Building className="w-4 h-4 mr-2" />
          Structures
        </Button>
        <Button
          variant={activeTab === 'statuts' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('statuts')}
          className="rounded-none"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Statuts
        </Button>
        <Button
          variant={activeTab === 'type_cotisations' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('type_cotisations')}
          className="rounded-none"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Cotisations
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
    </div>
  )
}
