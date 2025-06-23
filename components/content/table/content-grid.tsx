'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, Calendar } from 'lucide-react'
import type { Content } from './types'
import { format, parseISO } from 'date-fns'

interface ContentGridProps {
  content: Content[]
}

export function ContentGrid({ content }: ContentGridProps) {
  const router = useRouter()

  if (content.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p>No results found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {content.map((item) => {
        const authors = item.book_authors?.map(ba => ba.authors.name).join(', ') || 'Unknown Author'
        
        return (
          <div 
            key={item.content_id} 
            className="group relative bg-card rounded-lg overflow-hidden border transition-all duration-300 hover:shadow-lg hover:border-primary/50"
          >
            {/* Cover Image */}
            <div 
              className="relative aspect-[2/3] w-full bg-muted cursor-pointer overflow-hidden"
              onClick={() => router.push(`/dashboard/content/view/${item.content_id}`)}
            >
              {item.cover_image_url ? (
                <Image
                  src={item.cover_image_url}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <Badge 
                  variant={
                    item.status === 'available' ? 'success' : 
                    item.status === 'borrowed' ? 'warning' : 
                    item.status === 'reserved' ? 'secondary' : 
                    'outline'
                  }
                  className="shadow-sm"
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title and Author */}
              <div 
                className="cursor-pointer space-y-1 mb-3"
                onClick={() => router.push(`/dashboard/content/view/${item.content_id}`)}
              >
                <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {authors}
                </p>
              </div>

              {/* Metadata */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {item.file_type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {item.genres?.name || 'Uncategorized'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(parseISO(item.upload_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                <Button 
                  variant={item.status === 'available' ? 'default' : 'outline'}
                  size="sm"
                  disabled={item.status !== 'available'}
                  className="w-full"
                  onClick={() => router.push(`/dashboard/content/view/${item.content_id}`)}
                >
                  {item.status === 'available' ? (
                    <>
                      <BookOpen className="h-3.5 w-3.5 mr-2" />
                      Borrow Now
                    </>
                  ) : item.status === 'borrowed' ? (
                    <>
                      <Clock className="h-3.5 w-3.5 mr-2" />
                      Currently Borrowed
                    </>
                  ) : (
                    item.status.charAt(0).toUpperCase() + item.status.slice(1)
                  )}
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 