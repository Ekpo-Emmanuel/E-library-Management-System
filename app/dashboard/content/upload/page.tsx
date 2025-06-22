import { createServerClient } from '@/utils/supabase/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ContentUploadForm } from '@/components/content/content-upload-form'

export default async function UploadContentPage() {
  const supabase = await createServerClient()
  
  // Check user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/sign-in')
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError)
    redirect('/auth/sign-in')
  }

  // Verify user has appropriate role
  if (!['admin', 'librarian'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Fetch authors and genres
  const [authorsResponse, genresResponse] = await Promise.all([
    supabase
      .from('authors')
      .select('author_id, name')
      .order('name'),
    supabase
      .from('genres')
      .select('genre_id, name')
      .order('name')
  ])

  // Handle potential errors
  if (authorsResponse.error) {
    console.error('Error fetching authors:', authorsResponse.error)
    throw new Error('Failed to fetch authors. Please try again later.')
  }

  if (genresResponse.error) {
    console.error('Error fetching genres:', genresResponse.error)
    throw new Error('Failed to fetch genres. Please try again later.')
  }

  // Ensure we have data
  if (!authorsResponse.data || !genresResponse.data) {
    throw new Error('No data available. Please try again later.')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upload Digital Content</h1>
      </div>
      <ContentUploadForm
        authors={authorsResponse.data}
        genres={genresResponse.data}
      />
    </div>
  )
} 