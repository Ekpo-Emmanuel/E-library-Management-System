'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { joinWaitlist } from '@/app/actions/content'
import { toast } from 'sonner'
import { ContentStatus } from '@/utils/supabase/database.types'

interface WaitlistButtonProps {
  contentId: number
  status: ContentStatus
  waitlistPosition: number | null
  waitlistCount: number
  className?: string
}

function SubmitButton({ waitlistCount }: { waitlistCount: number }) {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      disabled={pending}
      variant="outline"
    >
      {pending ? 'Processing...' : `Join Waitlist (${waitlistCount} waiting)`}
    </Button>
  )
}

export function WaitlistButton({ 
  contentId, 
  status, 
  waitlistPosition, 
  waitlistCount,
  className 
}: WaitlistButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleJoinWaitlist(formData: FormData) {
    try {
      setIsSubmitting(true)
      const result = await joinWaitlist(formData)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to join waitlist')
        return
      }
      
      toast.success(result.message || 'Successfully joined waitlist')
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // If user is already in waitlist, show their position
  if (waitlistPosition !== null) {
    return (
      <Button disabled variant="outline" className={className}>
        Waitlist Position: {waitlistPosition}
      </Button>
    )
  }

  // Only show waitlist button if item is borrowed or reserved
  if (status !== 'borrowed' && status !== 'reserved') {
    return null
  }

  return (
    <form action={handleJoinWaitlist} className={className}>
      <input type="hidden" name="contentId" value={contentId} />
      <SubmitButton waitlistCount={waitlistCount} />
    </form>
  )
} 