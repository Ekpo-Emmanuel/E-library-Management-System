import { createServerClient } from '@/utils/supabase/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, UserCog, BookOpen, Clock, AlertTriangle } from 'lucide-react'
import { updateUser, deleteUser } from '@/app/actions/admin'
import { format, parseISO } from 'date-fns'
import { UserRole } from '@/utils/supabase/database.types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const supabase = await createServerClient()
  
  const { data: user } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', resolvedParams.id)
    .single()
  
  if (!user) {
    return {
      title: 'User Not Found | Admin Dashboard',
      description: 'The requested user could not be found',
    }
  }
  
  return {
    title: `${user.name} | Admin Dashboard`,
    description: `Manage user details for ${user.name}`,
  }
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const supabase = await createServerClient()
  
  // Get user details
  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()
  
  if (error || !user) {
    notFound()
  }
  
  // Get user's email from auth.users
  const { data: authUser } = await supabase.auth.admin.getUserById(resolvedParams.id)
  const email = authUser?.user?.email || ''
  
  // Get user's borrowing statistics
  const { data: borrowStats } = await supabase
    .from('borrow_records')
    .select('status')
    .eq('user_id', resolvedParams.id)
  
  const currentlyBorrowed = borrowStats?.filter(record => record.status === 'borrowed').length || 0
  const overdue = borrowStats?.filter(record => record.status === 'overdue').length || 0
  const returned = borrowStats?.filter(record => record.status === 'returned').length || 0
  
  // Get user's recent borrowing activity
  const { data: recentActivity } = await supabase
    .from('borrow_records')
    .select(`
      borrow_id,
      borrow_date,
      due_date,
      return_date,
      status,
      digital_content (
        content_id,
        title
      )
    `)
    .eq('user_id', resolvedParams.id)
    .order('borrow_date', { ascending: false })
    .limit(5)
  
  async function handleUpdateUser(formData: FormData) {
    'use server'
    const result = await updateUser(resolvedParams.id, formData)
    return redirect(`/admin/users/${resolvedParams.id}?success=User+updated+successfully`)
  }
  
  async function handleDeleteUser() {
    'use server'
    const result = await deleteUser(resolvedParams.id)
    return redirect('/admin/users?success=User+deleted+successfully')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" asChild className="mr-2">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{email}</p>
        </div>
        
        <Badge 
          variant={
            user.role === 'admin' ? 'default' : 
            user.role === 'librarian' ? 'secondary' : 
            'outline'
          }
          className="text-sm"
        >
          {user.role}
        </Badge>
      </div>
      
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <UserCog className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="activity">
            <BookOpen className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Update user details and permissions
              </CardDescription>
            </CardHeader>
            <form action={handleUpdateUser}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={user.name ?? ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={email}
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue={user.role}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="librarian">Librarian</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registration_date">Registration Date</Label>
                    <Input
                      id="registration_date"
                      name="registration_date"
                      defaultValue={user.registration_date ? format(parseISO(user.registration_date), 'yyyy-MM-dd') : ''}
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={user.address || ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={user.phone || ''}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <form action={handleDeleteUser}>
                  <Button type="submit" variant="destructive">
                    Delete User
                  </Button>
                </form>
                <Button type="submit">Update User</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary opacity-80 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Currently Borrowed</p>
                  <p className="text-2xl font-bold">{currentlyBorrowed}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center">
                  <Clock className="h-8 w-8 text-primary opacity-80 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Total Borrowed</p>
                  <p className="text-2xl font-bold">{borrowStats?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center">
                  <AlertTriangle className={`h-8 w-8 ${overdue > 0 ? 'text-destructive' : 'text-muted-foreground'} opacity-80 mb-2`} />
                  <p className="text-sm font-medium text-muted-foreground">Overdue Items</p>
                  <p className="text-2xl font-bold">{overdue}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                User's recent borrowing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((record) => (
                    <div key={record.borrow_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">{record.digital_content.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Borrowed: {format(parseISO(record.borrow_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status: <span className={
                            record.status === 'overdue' ? 'text-destructive' :
                            record.status === 'returned' ? 'text-green-600' :
                            'text-amber-600'
                          }>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/content/view/${record.digital_content.content_id}`}>
                            View Content
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No borrowing activity found</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/admin/reports/user/${resolvedParams.id}`}>
                  View Full Activity Report
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
