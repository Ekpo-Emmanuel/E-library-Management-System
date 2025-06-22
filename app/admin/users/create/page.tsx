import { createServerClient } from '@/utils/supabase/supabase-server'
import { redirect } from 'next/navigation'
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
import { ArrowLeft } from 'lucide-react'
import { createUser } from '@/app/actions/admin'
import { UserRole } from '@/utils/supabase/database.types'
import { AuthErrorResponse } from '@/utils/error-handling'
import { toast } from 'sonner'

export const metadata = {
  title: 'Create User | Admin Dashboard',
  description: 'Add a new user to the system',
}

export default async function CreateUserPage() {
  async function handleCreateUser(formData: FormData) {
    'use server'
    
    const result = await createUser(formData)
    
    if ('type' in result) {
      // Handle specific error types
      switch (result.type) {
        case 'email_already_exists':
          return redirect('/admin/users/create?error=A+user+with+this+email+already+exists')
        case 'invalid_email':
          return redirect('/admin/users/create?error=Please+enter+a+valid+email+address')
        case 'weak_password':
          return redirect('/admin/users/create?error=Password+is+too+weak.+It+must+be+at+least+6+characters')
        case 'unknown_error':
          console.error('Error creating user:', result)
          return redirect('/admin/users/create?error=' + encodeURIComponent(result.message))
        default:
          return redirect('/admin/users/create?error=An+unexpected+error+occurred')
      }
    }
    
    // Success case
    return redirect('/admin/users?success=User+created+successfully&userId=' + result.userId)
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
      
      <div>
        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="text-muted-foreground">
          Add a new user to the library management system
        </p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Enter the information for the new user account
          </CardDescription>
        </CardHeader>
        <form action={handleCreateUser}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter user's full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter user's email address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter temporary password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="student" required>
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
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter user's address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Enter user's phone number"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" asChild className="mr-2">
              <Link href="/admin/users">Cancel</Link>
            </Button>
            <Button type="submit">Create User</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
