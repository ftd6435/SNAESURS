export type UserRole = 'super_admin' | 'admin' | 'membre' | 'tresorier' | 'secretaire'
export type Genre = 'm' | 'f' | 'autre'

export interface User {
  id: number
  code?: string
  full_name: string
  telephone: string
  email?: string
  adresse?: string
  genre?: Genre
  date_naissance?: string
  approved_at?: string
  person_a_contacter?: string
  phone_person_a_contacter?: string
  role: UserRole
  avatar?: string
  avatar_url: string
  is_approved: boolean
  is_active: boolean
  email_verified_at?: string
  created_at: string
  updated_at: string
  assign_structures?: AssignStructure[]
  assign_statuts?: AssignStatut[]
  created_by?: User
  updated_by?: User
}

export interface AssignStructure {
  id: number
  user_id: number
  structure_id: number
  assigned_at: string
  is_active: boolean
  frais_integration: number
  structure?: Structure
  user?: User
}

export interface AssignStatut {
  id: number
  user_id: number
  statut_id: number
  date_debut: string
  date_fin?: string
  is_active: boolean
  statut?: Statut
  user?: User
}

export interface Structure {
  id: number
  libelle: string
  description?: string
  adresse?: string
  date_creation?: string
  logo?: string
  logo_url?: string
  contact?: string
  email?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Statut {
  id: number
  libelle: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
