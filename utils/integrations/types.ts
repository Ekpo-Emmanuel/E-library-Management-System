export type ExternalSystemType = 'moodle' | 'jstor' | 'proquest' | 'other'

export interface ExternalSystem {
  id: string
  name: string
  type: ExternalSystemType
  url: string
  api_key: string | null
  client_id: string | null
  client_secret: string | null
  enabled: boolean
  last_sync_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface ExternalSearchParams {
  query: string
  type?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  sort?: string
}

export interface ExternalSearchResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface MoodleCourse {
  id: number
  name: string
  shortname: string
  categoryId: number
  categoryName: string
  summary: string
  startDate: string
  endDate: string
}

export interface JstorResource {
  id: string
  title: string
  authors: string[]
  publicationDate: string
  doi: string
  url: string
  abstract: string
  type: 'article' | 'book' | 'chapter' | 'other'
}

export interface ProQuestResource {
  id: string
  title: string
  authors: string[]
  publicationDate: string
  doi: string
  url: string
  abstract: string
  type: 'dissertation' | 'thesis' | 'article' | 'other'
  university?: string
  department?: string
} 