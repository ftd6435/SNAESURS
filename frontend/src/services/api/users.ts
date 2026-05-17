import api from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { User, Structure, Statut } from '@/types/user'

export interface UsersFilters {
  search?: string
  role?: string
  is_approved?: boolean
  is_active?: boolean
  structure_id?: number
  init_cotisation_id?: number
  light?: boolean
  per_page?: number
  page?: number
}

export interface CreateUserData {
  code?: string
  full_name: string
  telephone: string
  email: string
  password: string
  password_confirmation: string
  role: string
  adresse?: string
  genre?: string
  date_naissance?: string
  person_a_contacter?: string
  phone_person_a_contacter?: string
  structure_id?: number
  statut_id?: number
  avatar?: File
}

export interface UpdateProfileData {
  full_name?: string
  telephone?: string
  email?: string
  adresse?: string
  genre?: string
  date_naissance?: string
  person_a_contacter?: string
  phone_person_a_contacter?: string
  avatar?: File
}

export interface ChangePasswordData {
  current_password: string
  password: string
  password_confirmation: string
}

export const usersApi = {
  getMe: () =>
    api.get<User>('/user'),

  getUsers: (params?: UsersFilters) =>
    api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params }),

  getBadgeUsers: (params?: { search?: string; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<User>>>('/users/badges/printable', { params }),

  createUser: (data: FormData) =>
    api.post<ApiResponse<User>>('/users', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  approveUser: (id: number) =>
    api.post<ApiResponse<User>>(`/users/${id}/approve`),

  toggleActive: (id: number) =>
    api.post<ApiResponse<User>>(`/users/${id}/toggle-active`),

  updateProfile: (data: FormData) => {
    ;(data as any).set?.('_method', 'PUT') ?? data.append('_method', 'PUT')

    return api.post<ApiResponse<User>>('/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  changePassword: (data: ChangePasswordData) =>
    api.post<ApiResponse>('/profile/change-password', data),
}

export const structuresApi = {
  getStructures: (params?: { search?: string; is_active?: boolean; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<Structure>>>('/settings/structures', { params }),

  getStructure: (id: number) =>
    api.get<ApiResponse<Structure>>(`/settings/structures/${id}`),

  createStructure: (data: FormData) =>
    api.post<ApiResponse<Structure>>('/settings/structures', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateStructure: (id: number, data: FormData) =>
    api.put<ApiResponse<Structure>>(`/settings/structures/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteStructure: (id: number) =>
    api.delete<ApiResponse>(`/settings/structures/${id}`),

  updateStructureActive: (id: number, is_active: boolean) =>
    api.put<ApiResponse<Structure>>(`/settings/structures/${id}`, { is_active }),
}

export const statutsApi = {
  getStatuts: (params?: { search?: string; is_active?: boolean; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<Statut>>>('/settings/statuts', { params }),

  getStatut: (id: number) =>
    api.get<ApiResponse<Statut>>(`/settings/statuts/${id}`),

  createStatut: (data: Partial<Statut>) =>
    api.post<ApiResponse<Statut>>('/settings/statuts', data),

  updateStatut: (id: number, data: Partial<Statut>) =>
    api.put<ApiResponse<Statut>>(`/settings/statuts/${id}`, data),

  deleteStatut: (id: number) =>
    api.delete<ApiResponse>(`/settings/statuts/${id}`),

  updateStatutActive: (id: number, is_active: boolean) =>
    api.put<ApiResponse<Statut>>(`/settings/statuts/${id}`, { is_active }),
}

export const typeCotisationsApi = {
  getTypeCotisations: (params?: { search?: string; is_active?: boolean; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/settings/type-cotisations', { params }),

  createTypeCotisation: (data: any) =>
    api.post<ApiResponse<any>>('/settings/type-cotisations', data),

  updateTypeCotisation: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/settings/type-cotisations/${id}`, data),

  deleteTypeCotisation: (id: number) =>
    api.delete<ApiResponse>(`/settings/type-cotisations/${id}`),

  updateTypeCotisationActive: (id: number, is_active: boolean) =>
    api.put<ApiResponse<any>>(`/settings/type-cotisations/${id}`, { is_active }),
}

export const typeDonsApi = {
  getTypeDons: (params?: { search?: string; is_open?: boolean; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/settings/type-dons', { params }),

  createTypeDon: (data: any) =>
    api.post<ApiResponse<any>>('/settings/type-dons', data),

  updateTypeDon: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/settings/type-dons/${id}`, data),

  deleteTypeDon: (id: number) =>
    api.delete<ApiResponse>(`/settings/type-dons/${id}`),

  updateTypeDonActive: (id: number, is_open: boolean) =>
    api.put<ApiResponse<any>>(`/settings/type-dons/${id}`, { is_open }),
}

export const typeDepensesApi = {
  getTypeDepenses: (params?: { search?: string; is_active?: boolean; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/settings/type-depenses', { params }),

  createTypeDepense: (data: any) =>
    api.post<ApiResponse<any>>('/settings/type-depenses', data),

  updateTypeDepense: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/settings/type-depenses/${id}`, data),

  deleteTypeDepense: (id: number) =>
    api.delete<ApiResponse>(`/settings/type-depenses/${id}`),

  updateTypeDepenseActive: (id: number, is_active: boolean) =>
    api.put<ApiResponse<any>>(`/settings/type-depenses/${id}`, { is_active }),
}

export const typeSanctionsApi = {
  getTypeSanctions: (params?: { search?: string; is_active?: boolean; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/settings/type-sanctions', { params }),

  createTypeSanction: (data: any) =>
    api.post<ApiResponse<any>>('/settings/type-sanctions', data),

  updateTypeSanction: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/settings/type-sanctions/${id}`, data),

  deleteTypeSanction: (id: number) =>
    api.delete<ApiResponse>(`/settings/type-sanctions/${id}`),

  updateTypeSanctionActive: (id: number, is_active: boolean) =>
    api.put<ApiResponse<any>>(`/settings/type-sanctions/${id}`, { is_active }),
}

export interface InitCotisationFilters {
  search?: string
  structure_id?: number
  type_cotisation_id?: number
  is_completed?: boolean
  per_page?: number
  page?: number
}

export interface CreateInitCotisationData {
  type_cotisation_id: number
  libelle: string
  structure_id: number
  montant: number
  date_limite?: string | null
  description?: string
  is_completed?: boolean
  cotisations?: Array<{
    user_id: number
    amount: number
    paid_at?: string | null
  }>
}

export interface CreateCotisationData {
  init_cotisation_id: number
  user_id: number
  amount: number
  paid_at?: string | null
}

export const initCotisationsApi = {
  getInitCotisations: (params?: InitCotisationFilters) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/gestion/init-cotisations', { params }),

  getInitCotisation: (id: number) =>
    api.get<ApiResponse<any>>(`/gestion/init-cotisations/${id}`),

  createInitCotisation: (data: CreateInitCotisationData) =>
    api.post<ApiResponse<any>>('/gestion/init-cotisations', data),

  updateInitCotisation: (id: number, data: Partial<CreateInitCotisationData>) =>
    api.put<ApiResponse<any>>(`/gestion/init-cotisations/${id}`, data),

  deleteInitCotisation: (id: number) =>
    api.delete<ApiResponse>(`/gestion/init-cotisations/${id}`),

  toggleCompleted: (id: number) =>
    api.post<ApiResponse<any>>(`/gestion/init-cotisations/${id}/toggle-completed`),
}

export const cotisationsApi = {
  getCotisations: (params?: { search?: string; init_cotisation_id?: number; user_id?: number; paid?: boolean; date_from?: string; date_to?: string; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/gestion/cotisations', { params }),

  getCotisationsStats: (params?: { search?: string; init_cotisation_id?: number; user_id?: number; paid?: boolean; date_from?: string; date_to?: string }) =>
    api.get<ApiResponse<any>>('/gestion/cotisations/stats', { params }),

  getCotisation: (id: number) =>
    api.get<ApiResponse<any>>(`/gestion/cotisations/${id}`),

  createCotisation: (data: CreateCotisationData) =>
    api.post<ApiResponse<any>>('/gestion/cotisations', data),

  updateCotisation: (id: number, data: Partial<CreateCotisationData>) =>
    api.put<ApiResponse<any>>(`/gestion/cotisations/${id}`, data),

  deleteCotisation: (id: number) =>
    api.delete<ApiResponse>(`/gestion/cotisations/${id}`),

}

export interface AssignStructurePayload {
  structure_id: number
  user_id: number
  assigned_at?: string
  frais_integration?: number
  remarks?: string
  is_active?: boolean
}

export interface AssignStatutPayload {
  user_id: number
  statut_id: number
  date_debut?: string
  date_fin: string
  remarks?: string
  parent_id?: number
  is_active?: boolean
}

export const assignStructuresApi = {
  list: (params?: { structure_id?: number; user_id?: number; is_active?: boolean; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/settings/assign-structures', { params }),
  create: (data: AssignStructurePayload) =>
    api.post<ApiResponse<any>>('/settings/assign-structures', data),
  update: (id: number, data: Partial<AssignStructurePayload>) =>
    api.put<ApiResponse<any>>(`/settings/assign-structures/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse>(`/settings/assign-structures/${id}`),
}

export const assignStatutsApi = {
  list: (params?: { statut_id?: number; user_id?: number; is_active?: boolean; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/settings/assign-statuts', { params }),
  create: (data: AssignStatutPayload) =>
    api.post<ApiResponse<any>>('/settings/assign-statuts', data),
  update: (id: number, data: Partial<AssignStatutPayload>) =>
    api.put<ApiResponse<any>>(`/settings/assign-statuts/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse>(`/settings/assign-statuts/${id}`),
}

export interface CreateReunionData {
  type: 'generale' | 'structure'
  structure_id?: number
  libelle: string
  description?: string
  date_reunion: string
  heure_debut: string
  heure_fin: string
  lieu?: string
  points_reunion?: string[]
  proces_verbal?: string[]
  status?: 'pending' | 'completed' | 'canceled'
}

export const reunionsApi = {
  getReunions: (params?: { search?: string; type?: 'generale' | 'structure'; status?: string; structure_id?: number; light?: boolean; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/gestion/reunions', { params }),

  getReunion: (id: number) =>
    api.get<ApiResponse<any>>(`/gestion/reunions/${id}`),

  createReunion: (data: CreateReunionData) =>
    api.post<ApiResponse<any>>('/gestion/reunions', data),

  updateReunion: (id: number, data: Partial<CreateReunionData>) =>
    api.put<ApiResponse<any>>(`/gestion/reunions/${id}`, data),

  deleteReunion: (id: number) =>
    api.delete<ApiResponse>(`/gestion/reunions/${id}`),

  downloadProcesVerbalPdf: (id: number) =>
    api.get(`/gestion/reunions/${id}/proces-verbal/pdf`, { responseType: 'blob' as const }),
}

export interface UpdateParticipantData {
  status?: 'pending' | 'present' | 'absent'
  comment?: string | null
}

export const participantsApi = {
  getParticipants: (params?: { reunion_id?: number; user_id?: number; search?: string; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/gestion/participants', { params }),

  updateParticipant: (participantId: number, data: UpdateParticipantData) =>
    api.put<ApiResponse<any>>(`/gestion/participants/${participantId}`, data),
}

export interface CreateDonData {
  user_id: number
  type_don_id: number
  montant: number
  structure_id: number
  commentaire?: string
}

export const donsApi = {
  getDons: (params?: { search?: string; user_id?: number; type_don_id?: number; structure_id?: number; date_from?: string; date_to?: string; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/gestion/dons', { params }),

  getDonsStats: (params?: { search?: string; user_id?: number; type_don_id?: number; structure_id?: number; date_from?: string; date_to?: string }) =>
    api.get<ApiResponse<any>>('/gestion/dons/stats', { params }),

  getDon: (id: number) =>
    api.get<ApiResponse<any>>(`/gestion/dons/${id}`),

  createDon: (data: CreateDonData) =>
    api.post<ApiResponse<any>>('/gestion/dons', data),

  updateDon: (id: number, data: Partial<CreateDonData>) =>
    api.put<ApiResponse<any>>(`/gestion/dons/${id}`, data),

  deleteDon: (id: number) =>
    api.delete<ApiResponse>(`/gestion/dons/${id}`),
}

export interface CreateDepenseData {
  type_depense_id: number
  structure_id: number
  montant: number
  commentaire?: string
}

export const depensesApi = {
  getDepenses: (params?: { search?: string; type_depense_id?: number; structure_id?: number; date_from?: string; date_to?: string; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/gestion/depenses', { params }),

  getDepensesStats: (params?: { search?: string; type_depense_id?: number; structure_id?: number; date_from?: string; date_to?: string }) =>
    api.get<ApiResponse<any>>('/gestion/depenses/stats', { params }),

  getDepense: (id: number) =>
    api.get<ApiResponse<any>>(`/gestion/depenses/${id}`),

  createDepense: (data: CreateDepenseData) =>
    api.post<ApiResponse<any>>('/gestion/depenses', data),

  updateDepense: (id: number, data: Partial<CreateDepenseData>) =>
    api.put<ApiResponse<any>>(`/gestion/depenses/${id}`, data),

  deleteDepense: (id: number) =>
    api.delete<ApiResponse>(`/gestion/depenses/${id}`),
}

export interface CreateSanctionData {
  user_id: number
  type_sanction_id: number
  structure_id: number
  montant: number
  commentaire?: string
}

export const sanctionsApi = {
  getSanctions: (params?: { search?: string; user_id?: number; type_sanction_id?: number; structure_id?: number; date_from?: string; date_to?: string; per_page?: number; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/gestion/sanctions', { params }),

  getSanctionsStats: (params?: { search?: string; user_id?: number; type_sanction_id?: number; structure_id?: number; date_from?: string; date_to?: string }) =>
    api.get<ApiResponse<any>>('/gestion/sanctions/stats', { params }),

  getSanction: (id: number) =>
    api.get<ApiResponse<any>>(`/gestion/sanctions/${id}`),

  createSanction: (data: CreateSanctionData) =>
    api.post<ApiResponse<any>>('/gestion/sanctions', data),

  updateSanction: (id: number, data: Partial<CreateSanctionData>) =>
    api.put<ApiResponse<any>>(`/gestion/sanctions/${id}`, data),

  deleteSanction: (id: number) =>
    api.delete<ApiResponse>(`/gestion/sanctions/${id}`),
}
