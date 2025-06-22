import { createServerClient } from '@/utils/supabase/supabase-server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ArrowLeft, FileType, Calendar, Lock, Eye } from 'lucide-react'
import { getContentBorrowStatus } from '@/app/actions/borrow'
import { getContentAvailabilityStatus, getProtectedContentUrl } from '@/app/actions/content'
import { ContentBorrowStatus } from '@/components/content/content-borrow-status'
import { ContentStatus, ContentAccessLevel, ContentViewMode } from '@/utils/supabase/database.types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const supabase = await createServerClient()
  
  const { data: content } = await supabase
    .from('digital_content')
    .select('title, description')
    .eq('content_id', parseInt(resolvedParams.id))
    .single()
  
  if (!content) {
    return {
      title: 'Content Not Found',
      description: 'The requested content could not be found',
    }
  }
  
  return {
    title: `${content.title} | Library Management System`,
    description: content.description || 'View content details',
  }
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const contentId = parseInt(resolvedParams.id)
  if (isNaN(contentId)) {
    notFound()
  }
  
  const supabase = await createServerClient()
  
  // Fetch content details with related data
  const { data: content, error } = await supabase
    .from('digital_content')
    .select(`
      *,
      genres(name),
      book_authors(
        authors(
          author_id,
          name
        )
      )
    `)
    .eq('content_id', contentId)
    .single()
  
  if (error || !content) {
    console.error('Error fetching content:', error)
    notFound()
  }
  
  // Get the content borrow and availability status
  const borrowStatus = await getContentBorrowStatus(contentId)
  const availabilityStatus = await getContentAvailabilityStatus(contentId)
  
  // Get protected content URL
  const { url: protectedUrl } = await getProtectedContentUrl(contentId)
  
  // Extract authors from the nested structure
  const authors = content.book_authors.map((ba: any) => ba.authors)
  
  // Helper function to get access level display text
  const getAccessLevelText = (level: ContentAccessLevel) => {
    switch (level) {
      case 'public':
        return 'Available to everyone'
      case 'restricted':
        return 'Requires authentication'
      case 'institution_only':
        return 'Available to institution members only'
      case 'subscription_only':
        return 'Available to subscribers only'
      default:
        return 'Unknown access level'
    }
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content List
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Cover image */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md">
                {content.cover_image_url ? (
                  <Image
                    src={content.cover_image_url}
                    alt={content.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <BookOpen className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <ContentBorrowStatus 
                contentId={contentId} 
                status={borrowStatus.status as ContentStatus} 
                userHasBorrowed={borrowStatus.userHasBorrowed}
                userHasReserved={availabilityStatus.userHasReserved ?? false}
                borrowId={borrowStatus.borrowId ?? null}
                reservationId={availabilityStatus.reservationId ?? null}
                waitlistPosition={availabilityStatus.waitlistPosition ?? null}
                waitlistCount={availabilityStatus.waitlistCount ?? 0}
              />
              
              {/* Access Level Badge */}
              <div className="flex items-center gap-2 mt-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">
                  {getAccessLevelText(content.access_level)}
                </Badge>
              </div>
              
              {/* View Mode Badge */}
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">
                  {content.view_mode === 'view_only' ? 'View Only' : 'Full Access'}
                </Badge>
              </div>
              
              {/* Protection Features */}
              <div className="text-sm text-muted-foreground mt-2">
                {content.watermark_enabled && (
                  <p>• Content will be watermarked</p>
                )}
                {content.drm_enabled && (
                  <p>• DRM protected content</p>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right column - Content details */}
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {authors.map((author: any) => (
              <Badge key={author.author_id} variant="outline">
                {author.name}
              </Badge>
            ))}
            
            {content.genres && (
              <Badge variant="secondary">
                {content.genres.name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FileType className="h-4 w-4" />
            <span>{content.file_type.toUpperCase()}</span>
            
            <Calendar className="h-4 w-4 ml-4" />
            <span>Uploaded on {new Date(content.upload_date).toLocaleDateString()}</span>
          </div>
          
          {content.publisher && (
            <p className="text-sm text-muted-foreground mb-4">
              Published by {content.publisher}
            </p>
          )}
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {content.description || 'No description available.'}
            </p>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Content Status</h2>
            <div className="flex items-center gap-2">
              <Badge variant={content.status === 'available' ? 'default' : 'secondary'}>
                {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {content.status === 'available' 
                  ? 'This item is available for borrowing.' 
                  : content.status === 'borrowed' 
                  ? 'This item is currently borrowed.'
                  : content.status === 'reserved'
                  ? 'This item is reserved.'
                  : 'This item is archived and not available for borrowing.'}
              </span>
            </div>
            {availabilityStatus.waitlistCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {availabilityStatus.waitlistCount} {availabilityStatus.waitlistCount === 1 ? 'person is' : 'people are'} waiting for this item.
              </p>
            )}
          </div>
          
          {/* Access Instructions */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Access Instructions</h2>
            <div className="text-sm text-muted-foreground">
              {content.view_mode === 'view_only' ? (
                <p>This content is available in view-only mode. You cannot download or copy the content.</p>
              ) : (
                <p>You have full access to this content. You can download and view the content offline.</p>
              )}
              {content.watermark_enabled && (
                <p className="mt-2">This content will be watermarked with your user information for tracking purposes.</p>
              )}
              {content.drm_enabled && (
                <p className="mt-2">This content is DRM protected. You will need compatible software to access it.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 