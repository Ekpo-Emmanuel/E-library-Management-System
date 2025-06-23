'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProtectedContentUrl } from '@/app/actions/content'
import { getContentBorrowStatus } from '@/app/actions/borrow'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function ContentReader({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
  const resolvedParams = await params
  const router = useRouter()
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const contentId = parseInt(resolvedParams.id)

  useEffect(() => {
    async function checkAccessAndGetUrl() {
      try {
        // Check if user has borrowed the content
        const borrowStatus = await getContentBorrowStatus(contentId)
        if (!borrowStatus.userHasBorrowed) {
          setError('You must borrow this content before you can view it.')
          return
        }

        // Get protected URL
        const { success, url: protectedUrl, error } = await getProtectedContentUrl(contentId)
        if (!success || !protectedUrl) {
          setError(error || 'Failed to get content URL')
          return
        }

        setUrl(protectedUrl)
      } catch (err) {
        setError('An error occurred while accessing the content')
      }
    }

    checkAccessAndGetUrl()
  }, [contentId])

  // Function to safely open content in a new tab
  const openContentInNewTab = () => {
    if (url) {
      // Use setTimeout to avoid potential blocking
      setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer')
      }, 100)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/content/view/${contentId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content Details
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="text-center py-10">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      ) : !url ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="w-full h-[calc(100vh-12rem)] flex flex-col items-center justify-center">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Your content is ready</h2>
            <p className="mb-6">Click the button below to view your content in a new tab</p>
            <Button 
              onClick={openContentInNewTab}
              className="flex items-center gap-2"
            >
              Open Content <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-8 p-4 bg-muted rounded-lg max-w-md">
            <p className="text-sm text-muted-foreground">
              Note: If nothing happens when you click the button, please check your browser's popup blocker settings and allow popups for this site.
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 