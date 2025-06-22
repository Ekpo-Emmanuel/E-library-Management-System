import { createServerClient } from '@/utils/supabase/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { format, isAfter, parseISO } from 'date-fns'
import { 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  BookMarked, 
  History, 
  Bookmark, 
  TrendingUp,
  Bell,
  Search,
  User
} from 'lucide-react'

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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="border-b pb-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName}</h1>
            <p className="text-muted-foreground">
              {profile?.role === 'admin' ? 'Administrator' : 
               profile?.role === 'librarian' ? 'Librarian' : 
               profile?.role === 'student' ? 'Student' : 'Guest'} Account
            </p>
          </div>
          <div className="flex items-center gap-4">

            <Button variant="outline" className="flex items-center gap-2" asChild>
              <Link href="/dashboard/profile">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Currently Borrowed</p>
                <p className="text-2xl font-bold">{currentlyBorrowed.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10">
              <div 
                className="h-full bg-primary" 
                style={{ 
                  width: `${Math.min((currentlyBorrowed.length / 10) * 100, 100)}%`
                }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Overdue Items</p>
                <p className="text-2xl font-bold">{overdue.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            {overdue.length > 0 && (
              <div className="mt-4">
                <Button variant="destructive" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/borrowed?filter=overdue">View Overdue Items</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Returned</p>
                <p className="text-2xl font-bold">{returnedItems.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-success/10">
              <div 
                className="h-full bg-success" 
                style={{ 
                  width: `${Math.min((returnedItems.length / 20) * 100, 100)}%`
                }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total History</p>
                <p className="text-2xl font-bold">{borrowedItems?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <History className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Currently Borrowed Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-primary" />
                  Currently Borrowed
                </CardTitle>
                <CardDescription>Your active borrowed items</CardDescription>
              </div>
              {currentlyBorrowed.length > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/borrowed">View All</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentlyBorrowed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">You don't have any borrowed items.</p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/content">Browse Library</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentlyBorrowed.slice(0, 4).map((item) => (
                  <Link 
                    key={item.borrow_id} 
                    href={`/dashboard/content/view/${item.digital_content.content_id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden transition-all hover:shadow-lg">
                      <div className="aspect-[3/4] relative">
                        {item.digital_content.cover_image_url ? (
                          <Image
                            src={item.digital_content.cover_image_url}
                            alt={item.digital_content.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={isAfter(new Date(), parseISO(item.due_date)) ? 'destructive' : 'secondary'}
                            className="shadow-sm"
                          >
                            Due {format(parseISO(item.due_date), 'MMM d')}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="pt-3">
                        <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {item.digital_content.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.digital_content.file_type.toUpperCase()}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations Section */}
        {recommendations && recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-primary" />
                    For You
                  </CardTitle>
                  <CardDescription>Based on your interests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {recommendations.slice(0, 4).map((item) => (
                  <Link 
                    key={item.content_id} 
                    href={`/dashboard/content/view/${item.content_id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden transition-all hover:shadow-lg">
                      <div className="aspect-[3/4] relative">
                        {item.cover_image_url ? (
                          <Image
                            src={item.cover_image_url}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="pt-3">
                        <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.book_authors[0]?.authors?.name || 'Unknown Author'}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dashboard/content">Explore More</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Popular Content Section */}
        {topContent && topContent.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Trending Now
                  </CardTitle>
                  <CardDescription>Most popular in the library</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {topContent.slice(0, 4).map((item) => (
                  <Link 
                    key={item.content_id} 
                    href={`/dashboard/content/view/${item.content_id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden transition-all hover:shadow-lg">
                      <div className="aspect-[3/4] relative">
                        {item.cover_image_url ? (
                          <Image
                            src={item.cover_image_url}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="pt-3">
                        <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.book_authors[0]?.authors?.name || 'Unknown Author'}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dashboard/content">View All</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
} 