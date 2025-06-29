import { createServerClient } from '@/utils/supabase/supabase-server'
import type { ContentStatus } from '@/utils/supabase/database.types'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  BookOpen,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, parseISO } from 'date-fns'
import { FilterForm } from '@/components/admin/filter-form'
import { ContentActions } from '@/components/content/table/content-actions'
import { deleteContent } from '@/app/actions/content'

export const metadata = {
  title: 'Content Management | Admin Dashboard',
  description: 'Manage digital content in the library system',
}

export default async function ContentManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; genre?: string; search?: string }>
}) {
  const supabase = await createServerClient()
  const params = await searchParams 

  const statusFilter = params.status || ''
  const genreFilter = params.genre && params.genre !== 'all' ? parseInt(params.genre) : undefined
  const searchQuery = params.search || ''
  
  // Get genres for filter
  const { data: genres } = await supabase
    .from('genres')
    .select('genre_id, name')
    .order('name')
  
  // Build query
  let query = supabase
    .from('digital_content')
    .select(`
      content_id,
      title,
      description,
      file_type,
      status,
      upload_date,
      cover_image_url,
      genres (
        genre_id,
        name
      ),
      book_authors (
        authors (
          author_id,
          name
        )
      )
    `)
    .order('upload_date', { ascending: false })
  
  // Apply status filter if specified
  if (statusFilter) {
    query = query.eq('status', statusFilter as ContentStatus)
  }
  
  // Apply genre filter if specified
  if (genreFilter) {
    query = query.eq('genre_id', genreFilter)
  }
  
  // Apply search filter if specified
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }
  
  // Execute query
  const { data: content, error } = await query
  
  if (error) {
    console.error('Error fetching content:', error)
  }
  
  // Get counts for each status
  const { data: statusCounts } = await supabase
    .from('digital_content')
    .select('status')
  
  // Count statuses manually
  const statusCountsMap = {
    available: 0,
    borrowed: 0,
    reserved: 0,
    archived: 0,
  }
  
  if (statusCounts) {
    statusCounts.forEach(item => {
      if (item.status in statusCountsMap) {
        statusCountsMap[item.status as keyof typeof statusCountsMap]++
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">
            Manage digital content in the library
          </p>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/content/upload">
            <Plus className="h-4 w-4" />
            New Content
          </Link>
        </Button>
      </div>

      {/* Status statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center">
              <Badge variant="default">Available</Badge>
              <p className="text-2xl font-bold mt-2">{statusCountsMap.available}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center">
              <Badge variant="secondary">Borrowed</Badge>
              <p className="text-2xl font-bold mt-2">{statusCountsMap.borrowed}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center">
              <Badge variant="outline">Reserved</Badge>
              <p className="text-2xl font-bold mt-2">{statusCountsMap.reserved}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center">
              <Badge variant="destructive">Archived</Badge>
              <p className="text-2xl font-bold mt-2">{statusCountsMap.archived}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Digital Content</CardTitle>
          <CardDescription>
            View and manage all digital content in the library
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <FilterForm genres={genres || []} />
          
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Title</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Genre</TableHead>
                    <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content && content.length > 0 ? (
                    content.map((item) => {
                      const authorName = item.book_authors?.[0]?.authors?.name || 'Unknown'                    
                      return (
                        <TableRow key={item.content_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 relative overflow-hidden rounded-md">
                                {item.cover_image_url ? (
                                  <Image
                                    src={item.cover_image_url}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-muted">
                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{authorName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell uppercase text-xs whitespace-nowrap">
                            {item.file_type}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge 
                              variant={
                                item.status === 'available' ? 'default' : 
                                item.status === 'borrowed' ? 'secondary' : 
                                item.status === 'reserved' ? 'outline' :
                                'destructive'
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            {item.genres?.name || 'Uncategorized'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            {item.upload_date ? format(parseISO(item.upload_date), 'MMM d, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <ContentActions 
                              contentId={item.content_id} 
                              onDelete={deleteContent}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No content found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
