'use server'

import { createServerClient } from '@/utils/supabase/supabase-server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { addDays, format } from 'date-fns'
import { ContentAccessLevel, ContentViewMode } from '@/utils/supabase/database.types'

// Default reservation expiry period in days
const DEFAULT_RESERVATION_EXPIRY = 2

// Validation schemas
const contentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  fileType: z.string().min(1, 'File type is required').max(20),
  genreId: z.number().optional(),
  publisher: z.string().max(255).optional(),
  authorIds: z.array(z.number()),
  newAuthors: z.array(z.string()),
  accessLevel: z.enum(['public', 'restricted', 'institution_only', 'subscription_only']).default('public'),
  viewMode: z.enum(['full_access', 'view_only']).default('full_access'),
  institutionId: z.string().optional(),
  watermarkEnabled: z.boolean().default(false),
  drmEnabled: z.boolean().default(false)
}).refine(data => data.authorIds.length > 0 || data.newAuthors.length > 0, {
  message: "At least one author must be provided",
  path: ["authorIds"]
});

const reserveItemSchema = z.object({
  contentId: z.number().int().positive('Content ID is required'),
})

const joinWaitlistSchema = z.object({
  contentId: z.number().int().positive('Content ID is required'),
})

type ContentFormData = z.infer<typeof contentSchema>

export async function uploadContent(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Check user role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'librarian'].includes(profile.role)) {
      throw new Error('Unauthorized: Only admins and librarians can upload content')
    }

    // Parse and validate form data
    const contentData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      fileType: formData.get('fileType') as string,
      genreId: formData.get('genreId') ? Number(formData.get('genreId')) : undefined,
      publisher: formData.get('publisher') as string,
      authorIds: JSON.parse(formData.get('authorIds') as string),
      newAuthors: JSON.parse(formData.get('newAuthors') as string || '[]'),
      accessLevel: formData.get('accessLevel') as ContentAccessLevel,
      viewMode: formData.get('viewMode') as ContentViewMode,
      institutionId: formData.get('institutionId') as string,
      watermarkEnabled: formData.get('watermarkEnabled') === 'on',
      drmEnabled: formData.get('drmEnabled') === 'on'
    }

    const validatedData = contentSchema.parse(contentData)

    // Handle file upload
    const file = formData.get('file') as File
    console.log('File from formData:', file ? `${file.name} (${file.size} bytes)` : 'No file found')
    
    if (!file || !file.size) {
      throw new Error('File is required and must not be empty')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `content/${fileName}`

    // Upload file to Supabase Storage with chunking for large files
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('digital-content')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl: fileUrl } } = supabase.storage
      .from('digital-content')
      .getPublicUrl(filePath)

    // Handle cover image upload if provided
    let coverImageUrl: string | undefined
    const coverImage = formData.get('coverImage') as File
    if (coverImage) {
      const coverExt = coverImage.name.split('.').pop()
      const coverFileName = `covers/${Math.random().toString(36).substring(2)}.${coverExt}`
      
      const coverArrayBuffer = await coverImage.arrayBuffer()
      const coverBuffer = new Uint8Array(coverArrayBuffer)

      const { error: coverUploadError } = await supabase.storage
        .from('digital-content')
        .upload(coverFileName, coverBuffer, {
          contentType: coverImage.type,
          upsert: true,
        })

      if (coverUploadError) {
        throw new Error(`Failed to upload cover image: ${coverUploadError.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('digital-content')
        .getPublicUrl(coverFileName)
      
      coverImageUrl = publicUrl
    }

    // Create new authors if any
    const newAuthorIds: number[] = []
    if (validatedData.newAuthors.length > 0) {
      for (const authorName of validatedData.newAuthors) {
        try {
          // First try to find if author already exists
          const { data: existingAuthor, error: fetchError } = await supabase
            .from('authors')
            .select('author_id')
            .eq('name', authorName)
            .single()

          if (!fetchError && existingAuthor) {
            // Author already exists
            newAuthorIds.push(existingAuthor.author_id)
            continue
          }

          // Try to insert with RPC call that bypasses RLS
          const { data: author, error: authorError } = await supabase.rpc('insert_author', { 
            author_name: authorName 
          })

          if (authorError) {
            throw new Error(`Failed to create author: ${authorError.message}`)
          }
          
          newAuthorIds.push(author)
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Failed to process author "${authorName}": ${error.message}`)
          }
          throw error
        }
      }
    }

    // Combine existing and new author IDs
    const allAuthorIds = [...validatedData.authorIds, ...newAuthorIds]

    // Insert content record using RPC function
    const { data: contentId, error: contentError } = await supabase.rpc(
      'insert_digital_content',
      {
        p_title: validatedData.title,
        p_description: validatedData.description ?? null,
        p_file_type: validatedData.fileType,
        p_file_url: fileUrl,
        p_cover_image_url: coverImageUrl ?? null,
        p_genre_id: validatedData.genreId ?? null,
        p_publisher: validatedData.publisher ?? null,
        p_created_by: user.id,
        p_updated_by: user.id,
        p_access_level: validatedData.accessLevel,
        p_view_mode: validatedData.viewMode,
        p_institution_id: validatedData.institutionId ?? null,
        p_watermark_enabled: validatedData.watermarkEnabled,
        p_drm_enabled: validatedData.drmEnabled
      }
    )

    if (contentError) {
      throw new Error(`Failed to create content record: ${contentError.message}`)
    }

    // Insert author associations using RPC function
    for (const authorId of allAuthorIds) {
      const { error: authorError } = await supabase.rpc(
        'insert_book_author',
        {
          p_content_id: contentId,
          p_author_id: authorId
        }
      )

      if (authorError) {
        throw new Error(`Failed to associate author: ${authorError.message}`)
      }
    }

    revalidatePath('/content')
    return { success: true, contentId }
  } catch (error) {
    console.error('Error uploading content:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

export async function updateContent(contentId: number, formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Check user role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'librarian'].includes(profile.role)) {
      throw new Error('Unauthorized: Only admins and librarians can update content')
    }

    // Parse and validate form data
    const contentData: ContentFormData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      fileType: formData.get('fileType') as string,
      genreId: formData.get('genreId') ? Number(formData.get('genreId')) : undefined,
      publisher: formData.get('publisher') as string,
      authorIds: JSON.parse(formData.get('authorIds') as string),
      newAuthors: JSON.parse(formData.get('newAuthors') as string || '[]'),
      accessLevel: formData.get('accessLevel') as ContentAccessLevel,
      viewMode: formData.get('viewMode') as ContentViewMode,
      institutionId: formData.get('institutionId') as string,
      watermarkEnabled: formData.get('watermarkEnabled') === 'on',
      drmEnabled: formData.get('drmEnabled') === 'on'
    }

    const validatedData = contentSchema.parse(contentData)

    // Update content record
    const { error: contentError } = await supabase
      .from('digital_content')
      .update({
        title: validatedData.title,
        description: validatedData.description,
        file_type: validatedData.fileType,
        genre_id: validatedData.genreId,
        publisher: validatedData.publisher,
        updated_by: user.id,
        access_level: validatedData.accessLevel,
        view_mode: validatedData.viewMode,
        institution_id: validatedData.institutionId,
        watermark_enabled: validatedData.watermarkEnabled,
        drm_enabled: validatedData.drmEnabled
      })
      .eq('content_id', contentId)

    if (contentError) {
      throw new Error(`Failed to update content: ${contentError.message}`)
    }

    // Update author associations
    // First, remove existing associations
    const { error: deleteError } = await supabase
      .from('book_authors')
      .delete()
      .eq('content_id', contentId)

    if (deleteError) {
      throw new Error(`Failed to remove existing author associations: ${deleteError.message}`)
    }

    // Then, insert new associations
    const authorAssociations = validatedData.authorIds.map(authorId => ({
      content_id: contentId,
      author_id: authorId,
    }))

    const { error: authorError } = await supabase
      .from('book_authors')
      .insert(authorAssociations)

    if (authorError) {
      throw new Error(`Failed to associate authors: ${authorError.message}`)
    }

    revalidatePath('/content')
    return { success: true }
  } catch (error) {
    console.error('Error updating content:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

export async function deleteContent(contentId: number) {
  try {
    const supabase = await createServerClient()
    
    // Check user role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'librarian'].includes(profile.role)) {
      throw new Error('Unauthorized: Only admins and librarians can delete content')
    }

    // Get content details to delete associated files
    const { data: content } = await supabase
      .from('digital_content')
      .select('file_url, cover_image_url')
      .eq('content_id', contentId)
      .single()

    if (!content) {
      throw new Error('Content not found')
    }

    // Delete associated files from storage
    if (content.file_url) {
      const filePath = content.file_url.split('/').pop()
      if (filePath) {
        await supabase.storage
          .from('digital-content')
          .remove([`content/${filePath}`])
      }
    }

    if (content.cover_image_url) {
      const coverPath = content.cover_image_url.split('/').pop()
      if (coverPath) {
        await supabase.storage
          .from('digital-content')
          .remove([`covers/${coverPath}`])
      }
    }

    // Delete content record (this will cascade delete author associations)
    const { error: deleteError } = await supabase
      .from('digital_content')
      .delete()
      .eq('content_id', contentId)

    if (deleteError) {
      throw new Error(`Failed to delete content: ${deleteError.message}`)
    }

    revalidatePath('/content')
    return { success: true }
  } catch (error) {
    console.error('Error deleting content:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Reserve a digital content item
 */
export async function reserveItem(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    // Parse and validate form data
    const contentId = parseInt(formData.get('contentId') as string)
    const validatedData = reserveItemSchema.parse({ contentId })

    // Check if user already has this item reserved
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('reservation_id')
      .eq('user_id', user.id)
      .eq('content_id', validatedData.contentId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingReservation) {
      throw new Error('You already have this item reserved')
    }

    // Calculate expiry date
    const expiryDate = format(
      addDays(new Date(), DEFAULT_RESERVATION_EXPIRY),
      'yyyy-MM-dd'
    )

    // Use the reserve_item function to create a new reservation
    const { data: reservationId, error } = await supabase.rpc('reserve_item', {
      p_user_id: user.id,
      p_content_id: validatedData.contentId,
      p_expiry_date: expiryDate,
    })

    if (error) {
      throw new Error(`Failed to reserve item: ${error.message}`)
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/content/${validatedData.contentId}`)
    
    return { 
      success: true, 
      reservationId,
      message: `Item reserved successfully. Expires on: ${expiryDate}` 
    }
  } catch (error) {
    console.error('Error reserving item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Join the waitlist for a digital content item
 */
export async function joinWaitlist(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    // Parse and validate form data
    const contentId = parseInt(formData.get('contentId') as string)
    const validatedData = joinWaitlistSchema.parse({ contentId })

    // Check if user is already in the waitlist
    const { data: existingEntry } = await supabase
      .from('waitlist')
      .select('waitlist_id')
      .eq('user_id', user.id)
      .eq('content_id', validatedData.contentId)
      .eq('status', 'waiting')
      .maybeSingle()

    if (existingEntry) {
      throw new Error('You are already in the waitlist for this item')
    }

    // Use the join_waitlist function to add user to waitlist
    const { data: waitlistId, error } = await supabase.rpc('join_waitlist', {
      p_user_id: user.id,
      p_content_id: validatedData.contentId,
    })

    if (error) {
      throw new Error(`Failed to join waitlist: ${error.message}`)
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/content/${validatedData.contentId}`)
    
    return { 
      success: true, 
      waitlistId,
      message: 'Successfully joined the waitlist' 
    }
  } catch (error) {
    console.error('Error joining waitlist:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Get content reservation and waitlist status
 */
export async function getContentAvailabilityStatus(contentId: number) {
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

    // Get current user's status
    const { data: { user } } = await supabase.auth.getUser()
    
    let userHasReserved = false
    let reservationId = null
    let waitlistPosition = null
    let waitlistId = null
    
    if (user) {
      // Check reservation status
      const { data: reservation } = await supabase
        .from('reservations')
        .select('reservation_id')
        .eq('content_id', contentId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle()
      
      userHasReserved = !!reservation
      reservationId = reservation?.reservation_id

      // Check waitlist status
      const { data: waitlistEntry } = await supabase
        .from('waitlist')
        .select('waitlist_id, position')
        .eq('content_id', contentId)
        .eq('user_id', user.id)
        .eq('status', 'waiting')
        .maybeSingle()
      
      if (waitlistEntry) {
        waitlistPosition = waitlistEntry.position
        waitlistId = waitlistEntry.waitlist_id
      }
    }

    // Get total waitlist count
    const { count: waitlistCount } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', contentId)
      .eq('status', 'waiting')

    return { 
      success: true, 
      status: content.status,
      userHasReserved,
      reservationId,
      waitlistPosition,
      waitlistId,
      waitlistCount: waitlistCount || 0
    }
  } catch (error) {
    console.error('Error fetching content availability status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      status: 'unknown',
      userHasReserved: false,
      reservationId: null,
      waitlistPosition: null,
      waitlistId: null,
      waitlistCount: 0
    }
  }
}

/**
 * Get protected content URL with applied security measures
 */
export async function getProtectedContentUrl(contentId: number) {
  try {
    const supabase = await createServerClient()
    
    // Use the get_protected_content_url function
    const { data: url, error } = await supabase.rpc(
      'get_protected_content_url',
      { p_content_id: contentId }
    )

    if (error) {
      throw new Error(`Failed to get protected content URL: ${error.message}`)
    }

    return { success: true, url }
  } catch (error) {
    console.error('Error getting protected content URL:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}   