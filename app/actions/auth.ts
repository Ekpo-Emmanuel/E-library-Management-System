'use server'

import { createServerClient } from '@/utils/supabase/supabase-server'
import { redirect } from 'next/navigation'
import { handleAuthError, type AuthErrorResponse } from '@/utils/error-handling'

export async function signIn(formData: FormData): Promise<AuthErrorResponse | { success: true } | void> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return handleAuthError(error)
    }

    if (data.user) {
      // Check if email is verified
      if (!data.user.email_confirmed_at) {
        return {
          type: 'email_not_verified',
          message: 'Please verify your email before signing in.',
        }
      }
    }
    
    return { success: true }
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function signUp(formData: FormData): Promise<AuthErrorResponse | void> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string

  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    })

    if (error) {
      return handleAuthError(error)
    }

    if (data.user) {
      return redirect('/auth/verify-email')
    }
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function signOut(): Promise<AuthErrorResponse | void> {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return handleAuthError(error)
    }
    
    return redirect('/auth/signin')
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function resetPassword(formData: FormData): Promise<AuthErrorResponse | { success: true }> {
  const email = formData.get('email') as string

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    })

    if (error) {
      return handleAuthError(error)
    }

    return { success: true }
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function updatePassword(formData: FormData): Promise<AuthErrorResponse | void> {
  const password = formData.get('password') as string

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return handleAuthError(error)
    }

    return redirect('/auth/signin?message=Password updated successfully')
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function resendVerificationEmail(): Promise<AuthErrorResponse | { success: true }> {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      return handleAuthError(userError)
    }

    if (!user) {
      return {
        type: 'unknown_error',
        message: 'No user found. Please sign in again.',
      }
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    })

    if (error) {
      return handleAuthError(error)
    }

    return { success: true }
  } catch (error) {
    return handleAuthError(error)
  }
} 