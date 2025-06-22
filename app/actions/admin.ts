'use server'

import { createServerClient } from '@/utils/supabase/supabase-server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { UserRole } from '@/utils/supabase/database.types'
import { handleAuthError, type AuthErrorResponse } from '@/utils/error-handling'

// Validation schemas
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['admin', 'librarian', 'student', 'guest'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
  address: z.string().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
})

type UserFormData = z.infer<typeof userSchema>

/**
 * Create a new user
 */
export async function createUser(formData: FormData): Promise<AuthErrorResponse | { success: true; userId: string }> {
  try {
    const supabase = await createServerClient()
    
    // Check if current user is an admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can create users')
    }

    // Parse and validate form data
    const userData: UserFormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as UserRole,
      address: formData.get('address') as string || null,
      phone: formData.get('phone') as string || null,
    }

    const validatedData = userSchema.parse(userData)

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true,
      user_metadata: {
        name: validatedData.name,
        role: validatedData.role,
      },
    })

    if (error) {
      return handleAuthError(error)
    }

    if (!data.user) {
      throw new Error('Failed to create user')
    }

    // Create or update profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        name: validatedData.name,
        role: validatedData.role,
        address: validatedData.address,
        phone: validatedData.phone,
        registration_date: new Date().toISOString(),
      })

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    revalidatePath('/admin/users')
    return { success: true, userId: data.user.id }
  } catch (error) {
    console.error('Error creating user:', error)
    return { 
      type: 'unknown_error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Update user details
 */
export async function updateUser(userId: string, formData: FormData): Promise<AuthErrorResponse | { success: true }> {
  try {
    const supabase = await createServerClient()
    
    // Check if current user is an admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can update users')
    }

    // Parse and validate form data
    const userData: Partial<UserFormData> = {
      name: formData.get('name') as string,
      role: formData.get('role') as UserRole,
      address: formData.get('address') as string || null,
      phone: formData.get('phone') as string || null,
    }

    // Update user metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        name: userData.name,
        role: userData.role,
      },
    })

    // Update profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: userData.name,
        role: userData.role,
        address: userData.address,
        phone: userData.phone,
      })
      .eq('id', userId)

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`)
    }

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating user:', error)
    return { 
      type: 'unknown_error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<AuthErrorResponse | { success: true }> {
  try {
    const supabase = await createServerClient()
    
    // Check if current user is an admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can delete users')
    }

    // Delete user from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      return handleAuthError(error)
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { 
      type: 'unknown_error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Get system statistics and reports
 */
export async function getSystemStats() {
  try {
    const supabase = await createServerClient()
    
    // Check if current user is an admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can view system stats')
    }

    // Get user count
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    // Get content count
    const { count: contentCount } = await supabase
      .from('digital_content')
      .select('*', { count: 'exact', head: true })
    
    // Get borrowed count
    const { count: borrowCount } = await supabase
      .from('borrow_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'borrowed')
    
    // Get overdue count
    const { count: overdueCount } = await supabase
      .from('borrow_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')

    // Get monthly borrow statistics for the current year
    const currentYear = new Date().getFullYear()
    const { data: monthlyBorrows } = await supabase
      .from('borrow_records')
      .select('borrow_date')
      .gte('borrow_date', `${currentYear}-01-01`)
      .lte('borrow_date', `${currentYear}-12-31`)
    
    // Count borrows by month
    const monthlyStats = Array(12).fill(0)
    if (monthlyBorrows) {
      monthlyBorrows.forEach(record => {
        const month = new Date(record.borrow_date).getMonth()
        monthlyStats[month]++
      })
    }

    return { 
      success: true, 
      stats: {
        userCount: userCount ?? 0,
        contentCount: contentCount ?? 0,
        borrowCount: borrowCount ?? 0,
        overdueCount: overdueCount ?? 0,
        monthlyStats,
        currentYear
      }
    }
  } catch (error) {
    console.error('Error fetching system stats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      stats: {
        userCount: 0,
        contentCount: 0,
        borrowCount: 0,
        overdueCount: 0,
        monthlyStats: Array(12).fill(0),
        currentYear: new Date().getFullYear()
      }
    }
  }
}

/**
 * Generate and export system report
 */
export async function generateSystemReport() {
  try {
    const supabase = await createServerClient()
    
    // Check if current user is an admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can generate system reports')
    }

    // Get basic system stats
    const { success, stats } = await getSystemStats()
    if (!success) {
      throw new Error('Failed to fetch system statistics')
    }

    // Get detailed user statistics
    const { data: userStats } = await supabase
      .from('profiles')
      .select('role')

    const userRoleDistribution = {
      admin: 0,
      librarian: 0,
      student: 0,
      guest: 0
    }
    userStats?.forEach(user => {
      if (user.role in userRoleDistribution) {
        userRoleDistribution[user.role as keyof typeof userRoleDistribution]++
      }
    })

    // Get content statistics
    const { data: contentStats } = await supabase
      .from('digital_content')
      .select(`
        status,
        access_level,
        view_mode,
        genres(name)
      `)

    const contentStatusDistribution = {
      available: 0,
      borrowed: 0,
      reserved: 0,
      archived: 0
    }
    const contentAccessDistribution = {
      public: 0,
      restricted: 0,
      institution_only: 0,
      subscription_only: 0
    }
    const genreDistribution: { [key: string]: number } = {}

    contentStats?.forEach(content => {
      // Count by status
      if (content.status in contentStatusDistribution) {
        contentStatusDistribution[content.status as keyof typeof contentStatusDistribution]++
      }
      // Count by access level
      if (content.access_level in contentAccessDistribution) {
        contentAccessDistribution[content.access_level as keyof typeof contentAccessDistribution]++
      }
      // Count by genre
      if (content.genres?.name) {
        genreDistribution[content.genres.name] = (genreDistribution[content.genres.name] || 0) + 1
      }
    })

    // Get borrowing statistics
    const { data: borrowStats } = await supabase
      .from('borrow_records')
      .select('status, borrow_date, return_date')

    const borrowStatusDistribution = {
      borrowed: 0,
      returned: 0,
      overdue: 0
    }
    let totalBorrowDuration = 0
    let borrowCount = 0

    borrowStats?.forEach(record => {
      // Count by status
      if (record.status in borrowStatusDistribution) {
        borrowStatusDistribution[record.status as keyof typeof borrowStatusDistribution]++
      }
      // Calculate average borrow duration for returned items
      if (record.status === 'returned' && record.return_date && record.borrow_date) {
        const duration = new Date(record.return_date).getTime() - new Date(record.borrow_date).getTime()
        totalBorrowDuration += duration
        borrowCount++
      }
    })

    const averageBorrowDuration = borrowCount > 0 ? Math.round(totalBorrowDuration / borrowCount / (1000 * 60 * 60 * 24)) : 0

    // Generate report content
    const report = {
      generatedAt: new Date().toISOString(),
      systemOverview: {
        totalUsers: stats.userCount,
        totalContent: stats.contentCount,
        activeBorrows: stats.borrowCount,
        overdueItems: stats.overdueCount,
        monthlyBorrowingActivity: stats.monthlyStats
      },
      userStatistics: {
        roleDistribution: userRoleDistribution
      },
      contentStatistics: {
        statusDistribution: contentStatusDistribution,
        accessDistribution: contentAccessDistribution,
        genreDistribution
      },
      borrowingStatistics: {
        statusDistribution: borrowStatusDistribution,
        averageBorrowDurationDays: averageBorrowDuration,
        monthlyActivity: stats.monthlyStats
      }
    }

    return { 
      success: true, 
      report,
      fileName: `system-report-${new Date().toISOString().split('T')[0]}.json`
    }
  } catch (error) {
    console.error('Error generating system report:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Download system report
 */
export async function downloadSystemReport() {
  try {
    const { success, report, fileName, error } = await generateSystemReport()
    
    if (!success || !report || !fileName) {
      throw new Error(error || 'Failed to generate report')
    }

    // Convert report to CSV format for better readability
    const csvContent = [
      // System Overview
      'System Overview',
      'Metric,Value',
      `Total Users,${report.systemOverview.totalUsers}`,
      `Total Content,${report.systemOverview.totalContent}`,
      `Active Borrows,${report.systemOverview.activeBorrows}`,
      `Overdue Items,${report.systemOverview.overdueItems}`,
      '',
      // Monthly Borrowing Activity
      'Monthly Borrowing Activity',
      'Month,Count',
      ...report.systemOverview.monthlyBorrowingActivity.map((count, index) => 
        `${new Date(0, index).toLocaleString('default', { month: 'long' })},${count}`
      ),
      '',
      // User Role Distribution
      'User Role Distribution',
      'Role,Count',
      ...Object.entries(report.userStatistics.roleDistribution).map(([role, count]) => 
        `${role},${count}`
      ),
      '',
      // Content Status Distribution
      'Content Status Distribution',
      'Status,Count',
      ...Object.entries(report.contentStatistics.statusDistribution).map(([status, count]) => 
        `${status},${count}`
      ),
      '',
      // Content Access Distribution
      'Content Access Distribution',
      'Access Level,Count',
      ...Object.entries(report.contentStatistics.accessDistribution).map(([level, count]) => 
        `${level},${count}`
      ),
      '',
      // Genre Distribution
      'Genre Distribution',
      'Genre,Count',
      ...Object.entries(report.contentStatistics.genreDistribution).map(([genre, count]) => 
        `${genre},${count}`
      ),
      '',
      // Borrowing Statistics
      'Borrowing Statistics',
      'Metric,Value',
      ...Object.entries(report.borrowingStatistics.statusDistribution).map(([status, count]) => 
        `${status},${count}`
      ),
      `Average Borrow Duration (Days),${report.borrowingStatistics.averageBorrowDurationDays}`,
    ].join('\n')

    // Return both CSV and JSON formats
    return { 
      success: true,
      formats: {
        csv: {
          content: csvContent,
          fileName: fileName.replace('.json', '.csv')
        },
        json: {
          content: JSON.stringify(report, null, 2),
          fileName
        }
      }
    }
  } catch (error) {
    console.error('Error downloading system report:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
} 