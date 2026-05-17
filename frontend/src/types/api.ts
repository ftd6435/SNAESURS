export interface ApiResponse<T = any> {
  status: 1 | 0
  message?: string
  data?: T
  token?: string
  error?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}
