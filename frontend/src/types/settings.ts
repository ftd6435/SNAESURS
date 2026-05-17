export interface TypeCotisation {
  id: number
  libelle: string
  description?: string
  montant: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TypeDon {
  id: number
  libelle: string
  description?: string
  montant_attendu?: number | null
  is_open: boolean
  created_at: string
  updated_at: string
}

export interface TypeDepense {
  id: number
  libelle: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TypeSanction {
  id: number
  libelle: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
