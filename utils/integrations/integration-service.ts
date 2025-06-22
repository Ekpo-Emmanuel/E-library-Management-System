'use server'

import { createServerClient } from '@/utils/supabase/supabase-server'
import { ExternalSystem, ExternalSystemType, ExternalSearchParams, ExternalSearchResult, MoodleCourse, JstorResource, ProQuestResource } from './types'
import { z } from 'zod'

// Validation schemas
const externalSystemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['moodle', 'jstor', 'proquest', 'other']),
  url: z.string().url('Must be a valid URL').or(z.literal('')),
  api_key: z.string().optional().nullable(),
  client_id: z.string().optional().nullable(),
  client_secret: z.string().optional().nullable(),
  enabled: z.boolean().default(false)
})

/**
 * Get all external systems
 */
export async function getExternalSystems() {
  try {
    const supabase = await createServerClient()
    
    // Check if user is admin or librarian
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
      throw new Error('Unauthorized: Only admins and librarians can view external systems')
    }

    const { data: systems, error } = await supabase
      .from('external_systems')
      .select('*')
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch external systems: ${error.message}`)
    }

    return { success: true, systems }
  } catch (error) {
    console.error('Error fetching external systems:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Create a new external system
 */
export async function createExternalSystem(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can create external systems')
    }

    // Parse and validate form data
    const systemData = {
      name: formData.get('name') as string,
      type: formData.get('type') as ExternalSystemType,
      url: formData.get('url') as string,
      api_key: formData.get('api_key') as string || null,
      client_id: formData.get('client_id') as string || null,
      client_secret: formData.get('client_secret') as string || null,
      enabled: formData.get('enabled') === 'true'
    }

    const validatedData = externalSystemSchema.parse(systemData)

    // Insert the external system
    const { data: system, error } = await supabase
      .from('external_systems')
      .insert({
        ...validatedData,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create external system: ${error.message}`)
    }

    return { success: true, system }
  } catch (error) {
    console.error('Error creating external system:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Update an external system
 */
export async function updateExternalSystem(systemId: string, formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can update external systems')
    }

    // Parse and validate form data
    const systemData = {
      name: formData.get('name') as string,
      type: formData.get('type') as ExternalSystemType,
      url: formData.get('url') as string,
      api_key: formData.get('api_key') as string,
      client_id: formData.get('client_id') as string,
      client_secret: formData.get('client_secret') as string,
      enabled: formData.get('enabled') === 'true'
    }

    const validatedData = externalSystemSchema.parse(systemData)

    // Update the external system
    const { data: system, error } = await supabase
      .from('external_systems')
      .update({
        ...validatedData,
        updated_by: user.id
      })
      .eq('id', systemId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update external system: ${error.message}`)
    }

    return { success: true, system }
  } catch (error) {
    console.error('Error updating external system:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Delete an external system
 */
export async function deleteExternalSystem(systemId: string) {
  try {
    const supabase = await createServerClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can delete external systems')
    }

    // Delete the external system
    const { error } = await supabase
      .from('external_systems')
      .delete()
      .eq('id', systemId)

    if (error) {
      throw new Error(`Failed to delete external system: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting external system:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Search external resources
 */
export async function searchExternalResources(systemId: string, params: ExternalSearchParams) {
  try {
    const supabase = await createServerClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    // Get the external system
    const { data: system, error: systemError } = await supabase
      .from('external_systems')
      .select('*')
      .eq('id', systemId)
      .single()

    if (systemError || !system) {
      throw new Error('External system not found')
    }

    if (!system.enabled) {
      throw new Error('External system is not enabled')
    }

    // Here we would implement the actual search logic for each system type
    // For now, we'll return a mock response
    const mockResults: ExternalSearchResult<JstorResource | ProQuestResource | MoodleCourse> = {
      items: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 10,
      hasMore: false
    }

    return { success: true, results: mockResults }
  } catch (error) {
    console.error('Error searching external resources:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Sync content with external system
 */
export async function syncExternalContent(systemId: string) {
  try {
    const supabase = await createServerClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: Please sign in')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can sync external content')
    }

    // Call the sync function
    const { data, error } = await supabase.rpc('sync_external_content', {
      p_system_id: systemId
    })

    if (error) {
      throw new Error(`Failed to sync external content: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error syncing external content:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
} 