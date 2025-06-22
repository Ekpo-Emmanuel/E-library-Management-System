import { AuthError } from '@supabase/supabase-js'

export type AuthErrorType = 
  | 'invalid_credentials'
  | 'email_not_verified'
  | 'email_already_exists'
  | 'weak_password'
  | 'invalid_email'
  | 'network_error'
  | 'redirect_error'
  | 'unknown_error'

export interface AuthErrorResponse {
  type: AuthErrorType
  message: string
  originalError?: unknown
}

export function handleAuthError(error: unknown): AuthErrorResponse {
  console.error('Auth error:', error)

  // Handle Next.js redirect errors (these aren't actual errors)
  if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
    // This is not an error but a redirect, so we should never reach this point
    // If we do, it means the redirect is being caught incorrectly
    return {
      type: 'redirect_error',
      message: 'Redirect in progress...',
      originalError: error
    }
  }

  if (error instanceof AuthError) {
    switch (error.message) {
      case 'Invalid login credentials':
        return {
          type: 'invalid_credentials',
          message: 'Invalid email or password. Please try again.',
          originalError: error
        }
      case 'Email not confirmed':
        return {
          type: 'email_not_verified',
          message: 'Please verify your email before signing in.',
          originalError: error
        }
      case 'User already registered':
        return {
          type: 'email_already_exists',
          message: 'An account with this email already exists.',
          originalError: error
        }
      case 'Password should be at least 6 characters':
        return {
          type: 'weak_password',
          message: 'Password must be at least 6 characters long.',
          originalError: error
        }
      case 'Invalid email':
        return {
          type: 'invalid_email',
          message: 'Please enter a valid email address.',
          originalError: error
        }
      default:
        return {
          type: 'unknown_error',
          message: 'An unexpected error occurred. Please try again.',
          originalError: error
        }
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('network')) {
      return {
        type: 'network_error',
        message: 'Network error. Please check your connection and try again.',
        originalError: error
      }
    }
    
    // More descriptive error message for other known errors
    return {
      type: 'unknown_error',
      message: `Error: ${error.message}`,
      originalError: error
    }
  }

  return {
    type: 'unknown_error',
    message: 'An unexpected error occurred. Please try again.',
    originalError: error
  }
} 