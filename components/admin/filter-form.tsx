'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, BookOpen, Search } from 'lucide-react'

interface FilterFormProps {
  genres?: {
    genre_id: number
    name: string
  }[]
  defaultRole?: string
  defaultSearch?: string
}

export function FilterForm({ genres, defaultRole, defaultSearch }: FilterFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleRoleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set('role', value)
    } else {
      params.delete('role')
    }
    router.push(`?${params.toString()}`)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    router.push(`?${params.toString()}`)
  }

  const handleGenreChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set('genre', value)
    } else {
      params.delete('genre')
    }
    router.push(`?${params.toString()}`)
  }

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          name="search"
          placeholder="Search..."
          className="pl-8"
          defaultValue={defaultSearch ?? searchParams.get('search') ?? ''}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      
      {defaultRole !== undefined ? (
        <div className="w-full md:w-[180px]">
          <Select 
            defaultValue={defaultRole || 'all'} 
            onValueChange={handleRoleChange}
          >
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="librarian">Librarian</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : genres ? (
        <>
          <div className="w-full md:w-[180px]">
            <Select 
              defaultValue={searchParams.get('status') ?? 'all'} 
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="borrowed">Borrowed</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-[200px]">
            <Select 
              defaultValue={searchParams.get('genre') ?? 'all'} 
              onValueChange={handleGenreChange}
            >
              <SelectTrigger className="w-full">
                <BookOpen className="h-4 w-4 mr-2" />
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
          </div>
        </>
      ) : null}
    </div>
  )
} 