'use client'

import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'

interface ContentPaginationProps {
  currentPage: number
  pageSize: number
  totalCount: number
}

export function ContentPagination({
  currentPage,
  pageSize,
  totalCount,
}: ContentPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {((currentPage - 1) * pageSize) + 1} to{' '}
        {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const params = new URLSearchParams(searchParams)
            params.set('page', String(currentPage - 1))
            router.push(`/dashboard/content?${params.toString()}`)
          }}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const params = new URLSearchParams(searchParams)
            params.set('page', String(currentPage + 1))
            router.push(`/dashboard/content?${params.toString()}`)
          }}
          disabled={currentPage * pageSize >= totalCount}
        >
          Next
        </Button>
      </div>
    </div>
  )
} 