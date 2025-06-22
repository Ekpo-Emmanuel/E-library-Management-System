'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { deleteContent } from '@/app/actions/content'
import { ContentFilters } from './table/content-filters'
import { ContentGrid } from './table/content-grid'
import { ContentTableView } from './table/content-table-view'
import { ContentPagination } from './table/content-pagination'
import { getColumns } from './table/columns'
import type { ContentTableProps } from './table/types'

export function ContentTable({
  content,
  totalCount,
  currentPage,
  pageSize,
  userRole,
  authors = [],
  genres = [],
  tags = [],
  authorFilter,
  genreFilter,
  tagFilter,
}: ContentTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = useState<SortingState>([])
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const handleDelete = async (contentId: number) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return
    }

    const result = await deleteContent(contentId)
    if (result.success) {
      toast.success('Content deleted successfully')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to delete content')
    }
  }

  const columns = getColumns(router, searchParams, userRole, handleDelete)

  const table = useReactTable({
    data: content,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="space-y-4">
      <ContentFilters
        authors={authors}
        genres={genres}
        tags={tags}
        authorFilter={authorFilter}
        genreFilter={genreFilter}
        tagFilter={tagFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === 'table' ? (
        <ContentTableView table={table} columns={columns} />
      ) : (
        <ContentGrid content={content} />
      )}

      <ContentPagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  )
} 