// 'use client'

import { createServerClient } from '@/utils/supabase/supabase-server'
import { Database } from '@/utils/supabase/database.types'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Search, Filter, Edit, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { FilterForm } from '@/components/admin/filter-form'

type Profile = Database['public']['Tables']['profiles']['Row']

export const metadata = {
  title: 'User Management | Admin Dashboard',
  description: 'Manage users in the library system',
}

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createServerClient()
  const params = await searchParams
  const roleFilter = Array.isArray(params.role) ? params.role[0] ?? '' : params.role ?? ''
  const searchQuery = Array.isArray(params.search) ? params.search[0] ?? '' : params.search ?? ''
  
  // Build query
  let query = supabase
    .from('profiles')
    .select('*')
    .order('registration_date', { ascending: false })
  
  // Apply role filter if specified
  if (roleFilter && roleFilter !== 'all') {
    query = query.eq('role', roleFilter as 'admin' | 'librarian' | 'student' | 'guest')
  }
  
  // Apply search filter if specified
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
  }
  
  // Execute query
  const { data: users, error } = await query
  
  if (error) {
    console.error('Error fetching users:', error)
  }
  
  // Get counts for each role
  const { data: roleCounts } = await supabase
    .from('profiles')
    .select('role')
  
  // Count roles manually
  const roleCountsMap = {
    admin: 0,
    librarian: 0,
    student: 0,
    guest: 0,
  }
  
  if (roleCounts) {
    roleCounts.forEach(user => {
      if (user.role in roleCountsMap) {
        roleCountsMap[user.role as keyof typeof roleCountsMap]++
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        
        {/* <Button asChild>
          <Link href="/admin/users/create">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New User
          </Link>
        </Button> */}
      </div>

      {/* Role statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center">
              <Badge variant="default">Admin</Badge>
              <p className="text-2xl font-bold mt-2">{roleCountsMap.admin}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center">
              <Badge variant="secondary">Librarian</Badge>
              <p className="text-2xl font-bold mt-2">{roleCountsMap.librarian}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center">
              <Badge variant="outline">Student</Badge>
              <p className="text-2xl font-bold mt-2">{roleCountsMap.student}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center">
              <Badge variant="outline">Guest</Badge>
              <p className="text-2xl font-bold mt-2">{roleCountsMap.guest}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>
            View and manage all user accounts in the system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Replace the filter form with the client component */}
          <FilterForm defaultRole={roleFilter} defaultSearch={searchQuery} />
          
          {/* Users table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            user.role === 'admin' ? 'default' : 
                            user.role === 'librarian' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.registration_date ? format(parseISO(user.registration_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <form>
                            <input type="hidden" name="userId" value={user.id} />
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 