'use server'

import { createServerClient } from '@/utils/supabase/supabase-server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { addDays, format } from 'date-fns'

// Default borrowing period in days
const DEFAULT_BORROW_PERIOD = 14

// Validation schemas
const borrowItemSchema = z.object({
  contentId: z.number().int().positive('Content ID is required'),
  borrowPeriod: z.number().int().min(1).optional(),
})

const returnItemSchema = z.object({
  borrowId: z.number().int().positive('Borrow ID is required'),
})

/**
 * Borrow a digital content item
 */
export async function borrowItem(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    // Parse and validate form data
    const contentId = parseInt(formData.get('contentId') as string)
    const borrowPeriod = formData.get('borrowPeriod') ? 
      parseInt(formData.get('borrowPeriod') as string) : 
      DEFAULT_BORROW_PERIOD

    const validatedData = borrowItemSchema.parse({
      contentId,
      borrowPeriod,
    })

    // Check if user already has this item borrowed
    const { data: existingBorrow } = await supabase
      .from('borrow_records')
      .select('borrow_id')
      .eq('user_id', user.id)
      .eq('content_id', validatedData.contentId)
      .eq('status', 'borrowed')
      .maybeSingle()

    if (existingBorrow) {
      throw new Error('You already have this item borrowed')
    }

    // Calculate due date
    const dueDate = format(
      addDays(new Date(), validatedData.borrowPeriod || DEFAULT_BORROW_PERIOD),
      'yyyy-MM-dd'
    )

    // Use the borrow_item function to create a new borrow record
    const { data: borrowId, error } = await supabase.rpc('borrow_item', {
      p_user_id: user.id,
      p_content_id: validatedData.contentId,
      p_due_date: dueDate,
    })

    if (error) {
      throw new Error(`Failed to borrow item: ${error.message}`)
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/content/${validatedData.contentId}`)
    
    return { 
      success: true, 
      borrowId,
      message: `Item borrowed successfully. Due date: ${dueDate}` 
    }
  } catch (error) {
    console.error('Error borrowing item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Return a borrowed item
 */
export async function returnItem(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    // Parse and validate form data
    const borrowId = parseInt(formData.get('borrowId') as string)
    const validatedData = returnItemSchema.parse({ borrowId })

    // Check if this borrow record belongs to the user (unless admin/librarian)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'librarian'].includes(profile?.role || '')) {
      // Regular user - check if the borrow record belongs to them
      const { data: borrowRecord } = await supabase
        .from('borrow_records')
        .select('user_id')
        .eq('borrow_id', validatedData.borrowId)
        .single()

      if (!borrowRecord || borrowRecord.user_id !== user.id) {
        throw new Error('You can only return items that you have borrowed')
      }
    }

    // Use the return_item function to update the borrow record
    const { data: success, error } = await supabase.rpc('return_item', {
      p_borrow_id: validatedData.borrowId,
    })

    if (error) {
      throw new Error(`Failed to return item: ${error.message}`)
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/borrowed')
    
    return { 
      success: true,
      message: 'Item returned successfully' 
    }
  } catch (error) {
    console.error('Error returning item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Get a user's borrowed items
 */
export async function getBorrowedItems() {
  try {
    const supabase = await createServerClient()
    
    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    // Get user's role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('borrow_records')
      .select(`
        borrow_id,
        borrow_date,
        due_date,
        return_date,
        status,
        user_id,
        digital_content (
          content_id,
          title,
          description,
          file_type,
          cover_image_url
        ),
        profiles (
          id,
          name
        )
      `)
      .order('due_date', { ascending: true })

    // If admin or librarian, can see all borrowed items
    // Otherwise, only show the user's own borrowed items
    if (!['admin', 'librarian'].includes(profile?.role || '')) {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch borrowed items: ${error.message}`)
    }

    return { 
      success: true, 
      data 
    }
  } catch (error) {
    console.error('Error fetching borrowed items:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      data: [] 
    }
  }
}

/**
 * Get content borrowing status
 */
export async function getContentBorrowStatus(contentId: number) {
  try {
    const supabase = await createServerClient()
    
    // Get content status
    const { data: content, error: contentError } = await supabase
      .from('digital_content')
      .select('status')
      .eq('content_id', contentId)
      .single()

    if (contentError) {
      throw new Error(`Failed to fetch content status: ${contentError.message}`)
    }

    // Check if current user has borrowed this item
    const { data: { user } } = await supabase.auth.getUser()
    
    let userHasBorrowed = false
    let borrowId = null
    
    if (user) {
      const { data: borrowRecord } = await supabase
        .from('borrow_records')
        .select('borrow_id')
        .eq('content_id', contentId)
        .eq('user_id', user.id)
        .eq('status', 'borrowed')
        .maybeSingle()
      
      userHasBorrowed = !!borrowRecord
      borrowId = borrowRecord?.borrow_id
    }

    return { 
      success: true, 
      status: content.status,
      userHasBorrowed,
      borrowId
    }
  } catch (error) {
    console.error('Error fetching content borrow status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      status: 'unknown',
      userHasBorrowed: false,
      borrowId: null
    }
  }
} 