'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { User, BookMarked, Tag, X, Filter, Grid, List } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Author, Genre, Tag as TagType } from './types'

interface ContentFiltersProps {
  authors: Author[]
  genres: Genre[]
  tags: TagType[]
  authorFilter?: number
  genreFilter?: number
  tagFilter?: number
  viewMode: 'table' | 'grid'
  onViewModeChange: (mode: 'table' | 'grid') => void
}

export function ContentFilters({
  authors,
  genres,
  tags,
  authorFilter,
  genreFilter,
  tagFilter,
  viewMode,
  onViewModeChange,
}: ContentFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Function to update URL with filters
  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams)
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to first page when filters change
    params.set('page', '1')
    
    router.push(`/dashboard/content?${params.toString()}`)
  }

  // Function to clear all filters
  const clearFilters = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('author')
    params.delete('genre')
    params.delete('tag')
    params.delete('search')
    params.set('page', '1')
    router.push(`/dashboard/content?${params.toString()}`)
  }

  // Check if any filters are active
  const hasActiveFilters = authorFilter || genreFilter || tagFilter || searchParams.get('search')

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by title or description..."
            className="w-full"
            defaultValue={searchParams.get('search') ?? ''}
            onChange={(e) => {
              const value = e.target.value
              const params = new URLSearchParams(searchParams)
              if (value) {
                params.set('search', value)
              } else {
                params.delete('search')
              }
              params.set('page', '1')
              router.push(`/dashboard/content?${params.toString()}`)
            }}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Select 
            value={authorFilter?.toString() || 'all'} 
            onValueChange={(value) => updateFilters('author', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by author" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              {authors.map((author) => (
                <SelectItem key={author.author_id} value={author.author_id.toString()}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={genreFilter?.toString() || 'all'} 
            onValueChange={(value) => updateFilters('genre', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <BookMarked className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre.genre_id} value={genre.genre_id.toString()}>
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={tagFilter?.toString() || 'all'} 
            onValueChange={(value) => updateFilters('tag', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <Tag className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.tag_id} value={tag.tag_id.toString()}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
          
          <div className="ml-auto flex items-center space-x-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => onViewModeChange('table')}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => onViewModeChange('grid')}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {authorFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {authors.find(a => a.author_id === authorFilter)?.name || 'Author'}
              <button 
                className="ml-1 hover:text-destructive" 
                onClick={() => updateFilters('author', null)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {genreFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <BookMarked className="h-3 w-3" />
              {genres.find(g => g.genre_id === genreFilter)?.name || 'Genre'}
              <button 
                className="ml-1 hover:text-destructive" 
                onClick={() => updateFilters('genre', null)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {tagFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tags.find(t => t.tag_id === tagFilter)?.name || 'Tag'}
              <button 
                className="ml-1 hover:text-destructive" 
                onClick={() => updateFilters('tag', null)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {searchParams.get('search') && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Search: "{searchParams.get('search')}"
              <button 
                className="ml-1 hover:text-destructive" 
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.delete('search')
                  params.set('page', '1')
                  router.push(`/dashboard/content?${params.toString()}`)
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
} 