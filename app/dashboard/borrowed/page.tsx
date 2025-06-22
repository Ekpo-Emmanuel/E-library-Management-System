import { BorrowedItemsList } from '@/components/content/borrowed-items-list'
import { getBorrowedItems } from '@/app/actions/borrow'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { isAfter, parseISO } from 'date-fns'

export const metadata = {
  title: 'Borrowed Items | Library Management System',
  description: 'Manage your borrowed items',
}

export default async function BorrowedItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await the searchParams
  const resolvedParams = await searchParams
  
  // Get filter from URL params
  const filter = typeof resolvedParams.filter === 'string' ? resolvedParams.filter : 'all'
  
  // Get borrowed items for statistics
  const borrowedItemsResult = await getBorrowedItems()
  const borrowedItems = borrowedItemsResult.success ? borrowedItemsResult.data : []
  
  // Calculate statistics
  const currentlyBorrowed = borrowedItems.filter(item => item.status === 'borrowed').length
  const overdue = borrowedItems.filter(item => 
    item.status === 'borrowed' && isAfter(new Date(), parseISO(item.due_date))
  ).length
  const returnedItems = borrowedItems.filter(item => item.status === 'returned').length
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Borrowed Items</h1>
        <p className="text-muted-foreground">
          View and manage your currently borrowed items
        </p>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currently Borrowed</p>
                <p className="text-2xl font-bold">{currentlyBorrowed}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Returned</p>
                <p className="text-2xl font-bold">{returnedItems}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{borrowedItems.length}</p>
              </div>
              <Clock className="h-8 w-8 text-secondary opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BorrowedItemsList initialFilter={filter} />
    </div>
  )
} 