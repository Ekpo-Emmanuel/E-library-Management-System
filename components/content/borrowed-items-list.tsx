'use client'

import { useEffect, useState } from 'react'
import { getBorrowedItems } from '@/app/actions/borrow'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ReturnButton } from './return-button'
import { Badge } from '@/components/ui/badge'
import { format, isAfter, parseISO } from 'date-fns'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BookOpen, ChevronDown, ChevronUp, Filter, InfoIcon, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/supabase-client'

type BorrowedItem = {
  borrow_id: number
  borrow_date: string
  due_date: string
  return_date: string | null
  status: 'borrowed' | 'returned' | 'overdue'
  user_id: string
  digital_content: {
    content_id: number
    title: string
    description: string | null
    file_type: string
    cover_image_url: string | null
  }
  profiles: {
    id: string
    name: string | null
  }
}

type SortField = 'title' | 'borrow_date' | 'due_date' | 'status'
type SortDirection = 'asc' | 'desc'

interface BorrowedItemsListProps {
  initialFilter?: string;
}

export function BorrowedItemsList({ initialFilter = 'all' }: BorrowedItemsListProps) {
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([])
  const [filteredItems, setFilteredItems] = useState<BorrowedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter)
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Get current user ID
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user ID:', user?.id)
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    async function fetchBorrowedItems() {
      try {
        setIsLoading(true)
        const result = await getBorrowedItems()
        
        if (!result.success) {
          setError(result.error || 'Failed to fetch borrowed items')
          return
        }
        
        console.log('Borrowed items:', result.data)
        setBorrowedItems(result.data || [])
        setFilteredItems(result.data || [])
      } catch (error) {
        setError('An unexpected error occurred')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBorrowedItems()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let result = [...borrowedItems]
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        // Filter for borrowed items that are overdue
        result = result.filter(item => 
          item.status === 'borrowed' && isAfter(new Date(), parseISO(item.due_date))
        )
      } else {
        result = result.filter(item => item.status === statusFilter)
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item => 
        item.digital_content.title.toLowerCase().includes(query) || 
        (item.digital_content.description && item.digital_content.description.toLowerCase().includes(query))
      )
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'title') {
        return sortDirection === 'asc' 
          ? a.digital_content.title.localeCompare(b.digital_content.title)
          : b.digital_content.title.localeCompare(a.digital_content.title)
      } else if (sortField === 'status') {
        return sortDirection === 'asc' 
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status)
      } else {
        // Date fields
        const dateA = new Date(a[sortField]).getTime()
        const dateB = new Date(b[sortField]).getTime()
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
      }
    })
    
    setFilteredItems(result)
  }, [borrowedItems, statusFilter, searchQuery, sortField, sortDirection])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  function getBadgeVariant(dueDate: string, status: string) {
    if (status === 'returned') return 'outline'
    if (isAfter(new Date(), parseISO(dueDate))) return 'destructive'
    return 'default'
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (borrowedItems.length === 0) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>No borrowed items</AlertTitle>
        <AlertDescription>
          You haven't borrowed any items yet. Browse the library to find something to read!
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrowed Items</CardTitle>
        <CardDescription>Manage your borrowed digital content</CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or description..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="borrowed">Currently Borrowed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Borrowed On</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No items match your search or filter criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.borrow_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 relative overflow-hidden rounded-sm flex-shrink-0">
                        {item.digital_content.cover_image_url ? (
                          <Image
                            src={item.digital_content.cover_image_url}
                            alt={item.digital_content.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <Link 
                          href={`/dashboard/content/view/${item.digital_content.content_id}`}
                          className="font-medium hover:underline"
                        >
                          {item.digital_content.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {item.digital_content.file_type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(parseISO(item.borrow_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={getBadgeVariant(item.due_date, item.status)}>
                      {format(parseISO(item.due_date), 'MMM d, yyyy')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'overdue' ? 'destructive' : item.status === 'returned' ? 'outline' : 'secondary'}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.status === 'borrowed' && item.user_id === currentUserId && (
                      <>
                        <div className="text-xs text-muted-foreground mb-1">
                          Your item
                        </div>
                        <ReturnButton borrowId={item.borrow_id} />
                      </>
                    )}
                    {item.status === 'borrowed' && item.user_id !== currentUserId && (
                      <span className="text-sm text-muted-foreground">
                        Borrowed by {item.profiles.name || 'another user'}
                      </span>
                    )}
                    {item.status === 'returned' && item.return_date && (
                      <span className="text-sm text-muted-foreground">
                        Returned on {format(parseISO(item.return_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredItems.length} of {borrowedItems.length} items
        </div>
      </CardFooter>
    </Card>
  )
}