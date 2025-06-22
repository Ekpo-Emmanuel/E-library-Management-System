import { createServerClient } from '@/utils/supabase/supabase-server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileForm } from '@/components/profile/profile-form'
import { BookOpen, Clock, AlertTriangle, User } from 'lucide-react'
import { getUserProfile, getUserBorrowingStats } from '@/app/actions/profile'

export const metadata = {
  title: 'My Profile | Library Management System',
  description: 'View and update your profile information',
}

export default async function ProfilePage() {
  // Get user profile
  const { success, profile, error } = await getUserProfile()
  
  if (!success || !profile) {
    console.error('Error fetching profile:', error)
    notFound()
  }
  
  // Get user borrowing stats
  const { stats } = await getUserBorrowingStats()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          View and manage your personal information
        </p>
      </div>
      
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">
            <User className="h-4 w-4 mr-2" />
            Personal Information
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BookOpen className="h-4 w-4 mr-2" />
            Library Statistics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal">
          <ProfileForm profile={profile} />
        </TabsContent>
        
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>Borrowing Statistics</CardTitle>
              <CardDescription>
                Your library activity statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center p-4 border rounded-md">
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm text-muted-foreground">Currently Borrowed</span>
                  <span className="text-2xl font-bold">{stats.currentlyBorrowed}</span>
                </div>
                
                <div className="flex flex-col items-center p-4 border rounded-md">
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm text-muted-foreground">Total Borrowed</span>
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
                
                <div className="flex flex-col items-center p-4 border rounded-md">
                  <AlertTriangle className={`h-8 w-8 ${stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'} mb-2`} />
                  <span className="text-sm text-muted-foreground">Overdue Items</span>
                  <span className="text-2xl font-bold">{stats.overdue}</span>
                </div>
                
                <div className="flex flex-col items-center p-4 border rounded-md">
                  <BookOpen className="h-8 w-8 text-green-600 mb-2" />
                  <span className="text-sm text-muted-foreground">Returned Items</span>
                  <span className="text-2xl font-bold">{stats.returned}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 