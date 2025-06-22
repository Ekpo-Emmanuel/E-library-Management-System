'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Heart } from 'lucide-react'
import type { Content } from './types'

interface ContentGridProps {
  content: Content[]
}

export function ContentGrid({ content }: ContentGridProps) {
  const router = useRouter()

  if (content.length === 0) {
    return (
      <div className="col-span-full text-center py-8 text-muted-foreground">
        No results.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {content.map((item) => (
        <div 
          key={item.content_id} 
          className="border rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow h-full"
        >
          <div 
            className="relative h-48 w-full bg-muted cursor-pointer"
            onClick={() => router.push(`/dashboard/content/view/${item.content_id}`)}
          >
            {item.cover_image_url ? (
              <Image
                src={item.cover_image_url}
                alt={item.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <h3 
              className="font-medium line-clamp-1 cursor-pointer"
              onClick={() => router.push(`/dashboard/content/view/${item.content_id}`)}
            >
              {item.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description || 'No description available'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {item.genres?.name || 'Uncategorized'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {item.file_type.toUpperCase()}
              </Badge>
            </div>
            <div className="mt-auto pt-3 flex items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={item.status !== 'available'}
                  className={item.status === 'available' ? 'text-green-600' : 'text-muted-foreground'}
                >
                  {item.status === 'available' ? (
                    <>
                      <BookOpen className="h-3.5 w-3.5 mr-1" />
                      Borrow
                    </>
                  ) : (
                    item.status.charAt(0).toUpperCase() + item.status.slice(1)
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Heart className="h-4 w-4" />
                  <span className="sr-only">Add to favorites</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 