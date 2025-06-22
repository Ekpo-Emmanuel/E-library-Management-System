import { createServerClient } from '@/utils/supabase/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { format, isAfter, parseISO } from 'date-fns'
import { BookOpen, Clock, AlertTriangle, CheckCircle, BookMarked, History, Bookmark, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  
  // Get user data directly - this is the recommended secure approach
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.log('Dashboard - No user data, redirecting to signin')
    redirect('/auth/signin')
  }

  // Check if email is verified
  if (!user.email_confirmed_at) {
    console.log('Dashboard - Email not verified, redirecting to verify-email')
    redirect('/auth/verify-email')
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  // Get user's borrowed items
  const { data: borrowedItems } = await supabase
    .from('borrow_records')
    .select(`
      borrow_id,
      borrow_date,
      due_date,
      return_date,
      status,
      digital_content (
        content_id,
        title,
        description,
        file_type,
        cover_image_url,
        genre_id
      )
    `)
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })
  
  // Calculate statistics
  const currentlyBorrowed = borrowedItems?.filter(item => item.status === 'borrowed') || []
  const overdue = currentlyBorrowed.filter(item => isAfter(new Date(), parseISO(item.due_date)))
  const returnedItems = borrowedItems?.filter(item => item.status === 'returned') || []
  
  // Get recently added content
  const { data: recentContent } = await supabase
    .from('digital_content')
    .select(`
      content_id,
      title,
      description,
      file_type,
      cover_image_url,
      upload_date,
      book_authors (
        authors (
          author_id,
          name
        )
      )
    `)
    .eq('status', 'available')
    .order('upload_date', { ascending: false })
    .limit(4)
  
  // Get user's reading preferences based on borrowed history
  const borrowedGenreIds = borrowedItems
    ?.filter(item => item.digital_content.genre_id)
    .map(item => item.digital_content.genre_id) || []
  
  // Get recommendations based on user's reading history
  const { data: recommendations } = await supabase
    .from('digital_content')
    .select(`
      content_id,
      title,
      description,
      file_type,
      cover_image_url,
      book_authors (
        authors (
          author_id,
          name
        )
      )
    `)
    .eq('status', 'available')
    .in('genre_id', borrowedGenreIds.length > 0 ? borrowedGenreIds : [0])
    .order('upload_date', { ascending: false })
    .limit(4)

  // Get popular content
  const { data: popularContent } = await supabase
    .from('borrow_records')
    .select(`
      content_id,
      digital_content (
        content_id,
        title,
        description,
        file_type,
        cover_image_url,
        book_authors (
          authors (
            author_id,
            name
          )
        )
      )
    `)
    .eq('status', 'borrowed')
    .limit(50)
  
  // Count occurrences of each content_id to find most borrowed
  const contentCounts: { [key: number]: number } = {}
  popularContent?.forEach(record => {
    const contentId = record.content_id
    contentCounts[contentId] = (contentCounts[contentId] || 0) + 1
  })
  
  // Sort by borrow count and get top 4
  const topContent = Object.entries(contentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([contentId]) => 
      popularContent?.find(record => record.content_id === parseInt(contentId))?.digital_content
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const userName = profile?.name || user.user_metadata.name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {userName}</h1>
          <p className="text-muted-foreground">
            {profile?.role === 'admin' ? 'Administrator' : 
             profile?.role === 'librarian' ? 'Librarian' : 
             profile?.role === 'student' ? 'Student' : 'Guest'} Dashboard
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/profile">
            Manage Profile
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currently Borrowed</p>
                <p className="text-2xl font-bold">{currentlyBorrowed.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/borrowed">View all</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{overdue.length}</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${overdue.length > 0 ? 'text-destructive' : 'text-muted-foreground'} opacity-80`} />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/borrowed?filter=overdue">View overdue</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Returned</p>
                <p className="text-2xl font-bold">{returnedItems.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success opacity-80" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/borrowed?filter=returned">View history</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{borrowedItems?.length || 0}</p>
              </div>
              <History className="h-8 w-8 text-secondary opacity-80" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/borrowed">View all</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Currently Borrowed Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookMarked className="mr-2 h-5 w-5" />
            Currently Borrowed
          </CardTitle>
          <CardDescription>Your currently borrowed items</CardDescription>
        </CardHeader>
        <CardContent>
          {currentlyBorrowed.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              You don't have any borrowed items. Browse the library to find something to read!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentlyBorrowed.slice(0, 4).map((item) => (
                <Card key={item.borrow_id} className="overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    {item.digital_content.cover_image_url ? (
                      <Image
                        src={item.digital_content.cover_image_url}
                        alt={item.digital_content.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={isAfter(new Date(), parseISO(item.due_date)) ? 'destructive' : 'secondary'}>
                        Due {format(parseISO(item.due_date), 'MMM d')}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-3">
                    <h3 className="font-medium line-clamp-1">{item.digital_content.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.digital_content.file_type.toUpperCase()}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href={`/dashboard/content/view/${item.digital_content.content_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        {currentlyBorrowed.length > 4 && (
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/dashboard/borrowed?filter=borrowed">
                View All Borrowed Items
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bookmark className="mr-2 h-5 w-5" />
              Recommended for You
            </CardTitle>
            <CardDescription>Based on your reading history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((item) => (
                <Card key={item.content_id} className="overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    {item.cover_image_url ? (
                      <Image
                        src={item.cover_image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-3">
                    <h3 className="font-medium line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.book_authors[0]?.authors?.name || 'Unknown Author'}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href={`/dashboard/content/view/${item.content_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Content */}
      {topContent && topContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Popular in the Library
            </CardTitle>
            <CardDescription>Most borrowed items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topContent.map((item) => (
                <Card key={item.content_id} className="overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    {item.cover_image_url ? (
                      <Image
                        src={item.cover_image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-3">
                    <h3 className="font-medium line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.book_authors[0]?.authors?.name || 'Unknown Author'}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href={`/dashboard/content/view/${item.content_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/dashboard/content">
                Browse All Content
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Recently Added */}
      {recentContent && recentContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recently Added
            </CardTitle>
            <CardDescription>New content in the library</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentContent.map((item) => (
                <Card key={item.content_id} className="overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    {item.cover_image_url ? (
                      <Image
                        src={item.cover_image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-3">
                    <h3 className="font-medium line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.book_authors[0]?.authors?.name || 'Unknown Author'}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href={`/dashboard/content/view/${item.content_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/dashboard/content">
                Browse All Content
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
} 