export interface Author {
  author_id: number
  name: string
}

export interface Genre {
  genre_id: number
  name: string
}

export interface Tag {
  tag_id: number
  name: string
}

export interface Content {
  content_id: number
  title: string
  description: string | null
  file_type: string
  status: 'available' | 'borrowed' | 'reserved' | 'archived'
  upload_date: string
  cover_image_url: string | null
  genres: { genre_id: number, name: string } | null
  book_authors: { authors: { author_id: number, name: string } }[]
}

export interface ContentTableProps {
  content: Content[]
  totalCount: number
  currentPage: number
  pageSize: number
  userRole: string
  authors?: Author[]
  genres?: Genre[]
  tags?: Tag[]
  authorFilter?: number
  genreFilter?: number
  tagFilter?: number
} 