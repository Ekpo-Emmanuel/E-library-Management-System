import { createServerClient } from '@/utils/supabase/supabase-server'
import { redirect } from 'next/navigation'
import { ContentTable } from '@/components/content/content-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/utils/supabase/database.types'

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await searchParams
  const params = await searchParams
  
  const supabase: SupabaseClient<Database> = await createServerClient()
  
  // Check user role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // Get user profile early
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  try {
    // Get query parameters with safe defaults
    const page = typeof params?.page === 'string' ? Number(params.page) : 1
    const limit = typeof params?.limit === 'string' ? Number(params.limit) : 10
    const search = typeof params?.search === 'string' ? params.search : ''
    const sortBy = typeof params?.sortBy === 'string' ? params.sortBy : 'upload_date'
    const sortOrder = typeof params?.sortOrder === 'string' && 
      (params.sortOrder === 'asc' || params.sortOrder === 'desc') 
      ? params.sortOrder 
      : 'desc'
    const authorFilter = typeof params?.author === 'string' ? Number(params.author) : undefined
    const genreFilter = typeof params?.genre === 'string' ? Number(params.genre) : undefined
    const tagFilter = typeof params?.tag === 'string' ? Number(params.tag) : undefined

    // Get all authors for filter dropdown
    const { data: authors } = await supabase
      .from('authors')
      .select('author_id, name')
      .order('name')

    // Get all genres for filter dropdown
    const { data: genres } = await supabase
      .from('genres')
      .select('genre_id, name')
      .order('name')
      
    // Get all tags for filter dropdown
    const { data: tags } = await supabase
      .from('tags')
      .select('tag_id, name')
      .order('name')

    // Build the query
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
        genres(
          genre_id,
          name
        ),
        book_authors(
          authors(
            author_id,
            name
          )
        )
      `, { count: 'exact' })

    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Add author filter if provided
    if (authorFilter) {
      // This requires a more complex query since we need to filter by a related table
      // First, get the content_ids that match the author
      const { data: authorContents } = await supabase
        .from('book_authors')
        .select('content_id')
        .eq('author_id', authorFilter)
      
      if (authorContents && authorContents.length > 0) {
        const contentIds = authorContents.map(item => item.content_id)
        query = query.in('content_id', contentIds)
      } else {
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Digital Content</h1>
              {profile && ['admin', 'librarian'].includes(profile.role) && (
                <Button asChild>
                  <Link href="/dashboard/content/upload">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Content
                  </Link>
                </Button>
              )}
            </div>

            <ContentTable
              content={[]}
              totalCount={0}
              currentPage={page}
              pageSize={limit}
              userRole={profile?.role || 'guest'}
              authors={authors || []}
              genres={genres || []}
              tags={tags || []}
              authorFilter={authorFilter}
              genreFilter={genreFilter}
              tagFilter={tagFilter}
            />
          </div>
        )
      }
    }

    // Add genre filter if provided
    if (genreFilter) {
      query = query.eq('genre_id', genreFilter)
    }
    
    // Add tag filter if provided
    if (tagFilter) {
      // Similar to author filter, we need to get content_ids that match the tag
      const { data: tagContents } = await supabase
        .from('content_tags')
        .select('content_id')
        .eq('tag_id', tagFilter)
      
      if (tagContents && tagContents.length > 0) {
        const contentIds = tagContents.map(item => item.content_id)
        query = query.in('content_id', contentIds)
      } else {
        // No content matches this tag, return empty result
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Digital Content</h1>
              {profile && ['admin', 'librarian'].includes(profile.role) && (
                <Button asChild>
                  <Link href="/dashboard/content/upload">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Content
                  </Link>
                </Button>
              )}
            </div>

            <ContentTable
              content={[]}
              totalCount={0}
              currentPage={page}
              pageSize={limit}
              userRole={profile?.role || 'guest'}
              authors={authors || []}
              genres={genres || []}
              tags={tags || []}
              authorFilter={authorFilter}
              genreFilter={genreFilter}
              tagFilter={tagFilter}
            />
          </div>
        )
      }
    }

    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: content, error, count } = await query

    if (error) {
      console.error('Error fetching content:', error)
      throw new Error('Failed to fetch content')
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Digital Content</h1>
          {profile && ['admin', 'librarian'].includes(profile.role) && (
            <Button asChild>
              <Link href="/dashboard/content/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload Content
              </Link>
            </Button>
          )}
        </div>

        <ContentTable
          content={content}
          totalCount={count || 0}
          currentPage={page}
          pageSize={limit}
          userRole={profile?.role || 'guest'}
          authors={authors || []}
          genres={genres || []}
          tags={tags || []}
          authorFilter={authorFilter}
          genreFilter={genreFilter}
          tagFilter={tagFilter}
        />
      </div>
    )
  } catch (error) {
    console.error('Error in content page:', error)
    throw new Error('An error occurred while loading the content page')
  }
} 