import { createServerClient } from '@/utils/supabase/supabase-server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Clock, AlertTriangle, UserPlus, BookPlus, Settings, BarChart3 } from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard | Library Management System',
  description: 'Admin dashboard for library management system',
}

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()
  
  // Get system statistics
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  const { count: contentCount } = await supabase
    .from('digital_content')
    .select('*', { count: 'exact', head: true })
  
  const { count: borrowCount } = await supabase
    .from('borrow_records')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'borrowed')
  
  const { count: overdueCount } = await supabase
    .from('borrow_records')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'overdue')
  
  // Get recent users
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, name, role, registration_date')
    .order('registration_date', { ascending: false })
    .limit(5)
  
  // Get recent content
  const { data: recentContent } = await supabase
    .from('digital_content')
    .select('content_id, title, status, upload_date')
    .order('upload_date', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, content, and system settings
        </p>
      </div>

      {/* Quick Actions */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <Link href="/admin/users/create">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-1">
                <UserPlus className="h-6 w-6" />
                <span>Add User</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <Link href="/dashboard/content/upload">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-1">
                <BookPlus className="h-6 w-6" />
                <span>Add Content</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-1">
                <BarChart3 className="h-6 w-6" />
                <span>Generate Reports</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-1">
                <Settings className="h-6 w-6" />
                <span>System Settings</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div> */}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{userCount}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users">View all users</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Content</p>
                <p className="text-2xl font-bold">{contentCount}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/content">Manage content</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currently Borrowed</p>
                <p className="text-2xl font-bold">{borrowCount}</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/reports/borrowed">View details</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Items</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${(overdueCount ?? 0) > 0 ? 'text-destructive' : 'text-muted-foreground'} opacity-80`} />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/reports/overdue">View overdue</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>
              Latest user registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers?.map((user) => (
                <div key={user.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/users/${user.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/admin/users">
                View All Users
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Content</CardTitle>
            <CardDescription>
              Latest content uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContent?.map((content) => (
                <div key={content.content_id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{content.title}</p>
                    <p className="text-sm text-muted-foreground capitalize">{content.status}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/content/view/${content.content_id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/admin/content">
                Manage All Content
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
