'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { resendVerificationEmail } from '@/app/actions/auth'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? 'Sending...' : 'Resend Verification Email'}
    </Button>
  )
}

export function ResendVerificationButton() {
  const [isResending, setIsResending] = useState(false)

  const handleResend = async () => {
    try {
      setIsResending(true)
      const result = await resendVerificationEmail()
      
      if (result && 'type' in result) {
        toast.error(result.message)
      } else {
        toast.success('Verification email sent! Please check your inbox.')
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <form action={handleResend}>
      <SubmitButton />
    </form>
  )
} 