'use server'

import { createServerClient } from '@/utils/supabase/supabase-server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { UserRole } from '@/utils/supabase/database.types'

// Validation schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  address: z.string().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
})

type ProfileFormData = z.infer<typeof profileSchema>

/**
 * Get the current user's profile
 */
export async function getUserProfile() {
  try {
    const supabase = await createServerClient()
    
    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }

    return { 
      success: true, 
      profile 
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    // Parse and validate form data
    const profileData: ProfileFormData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string || null,
      phone: formData.get('phone') as string || null,
    }

    const validatedData = profileSchema.parse(profileData)

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({
        name: validatedData.name,
        address: validatedData.address,
        phone: validatedData.phone,
      })
      .eq('id', user.id)

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    // Also update user metadata
    await supabase.auth.updateUser({
      data: {
        name: validatedData.name,
      },
    })

    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Get user's borrowing statistics
 */
export async function getUserBorrowingStats() {
  try {
    const supabase = await createServerClient()
    
    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    // Get all borrow records
    const { data: borrowRecords, error } = await supabase
      .from('borrow_records')
      .select('status')
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`Failed to fetch borrowing stats: ${error.message}`)
    }

    // Calculate statistics
    const currentlyBorrowed = borrowRecords?.filter(record => record.status === 'borrowed').length || 0
    const overdue = borrowRecords?.filter(record => record.status === 'overdue').length || 0
    const returned = borrowRecords?.filter(record => record.status === 'returned').length || 0
    const total = borrowRecords?.length || 0

    return { 
      success: true, 
      stats: {
        currentlyBorrowed,
        overdue,
        returned,
        total
      }
    }
  } catch (error) {
    console.error('Error fetching borrowing stats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      stats: {
        currentlyBorrowed: 0,
        overdue: 0,
        returned: 0,
        total: 0
      }
    }
  }
} 