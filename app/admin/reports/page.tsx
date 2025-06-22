import { createServerClient } from '@/utils/supabase/supabase-server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Clock, 
  AlertTriangle,
  Download,
  FileJson,
  FileText
} from 'lucide-react'
import { getSystemStats, downloadSystemReport } from '@/app/actions/admin'
import { redirect } from 'next/navigation'
import { ReportDownloadButtons } from '@/components/admin/report-download-buttons'

export const metadata = {
  title: 'Reports | Admin Dashboard',
  description: 'Generate and view system reports',
}

export default async function ReportsPage() {
  const { success, error, stats } = await getSystemStats()
  
  if (!success) {
    // If unauthorized, redirect to sign in
    if (error?.includes('Unauthorized')) {
      redirect('/auth/signin?error=' + encodeURIComponent(error))
    }
    // For other errors, we'll show the page with empty stats (they're provided in the error response)
    console.error('Error loading reports:', error)
  }

  const { 
    userCount, 
    contentCount, 
    borrowCount, 
    overdueCount, 
    monthlyStats,
    currentYear 
  } = stats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Generate and view system reports and statistics
        </p>
      </div>

      {/* System overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Current system statistics and metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 border rounded-md">
              <Users className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Total Users</span>
              <span className="text-2xl font-bold">{userCount ?? 0}</span>
            </div>
            
            <div className="flex flex-col items-center p-4 border rounded-md">
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Total Content</span>
              <span className="text-2xl font-bold">{contentCount ?? 0}</span>
            </div>
            
            <div className="flex flex-col items-center p-4 border rounded-md">
              <Clock className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Currently Borrowed</span>
              <span className="text-2xl font-bold">{borrowCount ?? 0}</span>
            </div>
            
            <div className="flex flex-col items-center p-4 border rounded-md">
              <AlertTriangle className={`h-8 w-8 ${(overdueCount ?? 0) > 0 ? 'text-destructive' : 'text-muted-foreground'} mb-2`} />
              <span className="text-sm text-muted-foreground">Overdue Items</span>
              <span className="text-2xl font-bold">{overdueCount ?? 0}</span>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Monthly Borrowing Activity ({currentYear})</h3>
            <div className="h-64 flex items-end space-x-2">
              {monthlyStats.map((count, index) => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                const maxCount = Math.max(...monthlyStats, 1)
                const percentage = (count / maxCount) * 100
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-primary rounded-t-sm" 
                      style={{ height: `${Math.max(percentage, 5)}%` }}
                    ></div>
                    <span className="text-xs text-muted-foreground mt-2">{monthNames[index]}</span>
                    <span className="text-xs font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <ReportDownloadButtons />
        </CardFooter>
      </Card>
    </div>
  )
}
