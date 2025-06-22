'use server'

import { createServerClient } from '@/utils/supabase/supabase-server'
import { z } from 'zod'

// Validation schema for feedback
const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'support', 'other']),
  message: z.string().min(1, 'Message is required').max(1000),
})

export async function submitFeedback(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    // Parse and validate form data
    const validatedData = feedbackSchema.parse({
      type: formData.get('type'),
      message: formData.get('message'),
    })

    // Insert feedback into the database
    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        type: validatedData.type,
        message: validatedData.message,
        status: 'pending',
      })

    if (error) {
      throw new Error(`Failed to submit feedback: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
} 