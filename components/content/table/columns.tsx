'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, ArrowUpDown, BookOpen } from 'lucide-react'
import Image from 'next/image'
import type { Content } from './types'

export function getColumns(
  router: any,
  searchParams: any,
  userRole: string,
  handleDelete: (id: number) => Promise<void>
): ColumnDef<Content>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = column.getIsSorted() === 'asc' ? 'desc' : 'asc'
              const params = new URLSearchParams(searchParams)
              params.set('sortBy', 'title')
              params.set('sortOrder', newOrder)
              router.push(`/dashboard/content?${params.toString()}`)
            }}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const content = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 relative overflow-hidden rounded-md flex-shrink-0">
              {content.cover_image_url ? (
                <Image
                  src={content.cover_image_url}
                  alt={content.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-left"
              onClick={() => router.push(`/dashboard/content/view/${content.content_id}`)}
            >
              {content.title}
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: 'genres',
      header: 'Genre',
      cell: ({ row }) => row.original.genres?.name || '-',
    },
    {
      accessorKey: 'book_authors',
      header: 'Authors',
      cell: ({ row }) => {
        const authors = row.original.book_authors
          .map(ba => ba.authors.name)
          .join(', ')
        return authors || '-'
      },
    },
    {
      accessorKey: 'file_type',
      header: 'Type',
      cell: ({ row }) => row.original.file_type.toUpperCase(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const variants: Record<string, string> = {
          available: 'success',
          borrowed: 'warning',
          reserved: 'info',
          archived: 'secondary',
        }
        return (
          <Badge variant={variants[status] as any}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'upload_date',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = column.getIsSorted() === 'asc' ? 'desc' : 'asc'
              const params = new URLSearchParams(searchParams)
              params.set('sortBy', 'upload_date')
              params.set('sortOrder', newOrder)
              router.push(`/dashboard/content?${params.toString()}`)
            }}
          >
            Upload Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => new Date(row.original.upload_date).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const content = row.original
        const canEdit = ['admin', 'librarian'].includes(userRole)

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/content/view/${content.content_id}`)}
              >
                View
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push(`/dashboard/content/${content.content_id}/edit`)}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(content.content_id)}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
} 