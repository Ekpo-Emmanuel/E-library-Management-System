'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { reserveItem } from '@/app/actions/content'
import { toast } from 'sonner'
import { ContentStatus } from '@/utils/supabase/database.types'

interface ReserveButtonProps {
  contentId: number
  status: ContentStatus
  userHasReserved: boolean
  className?: string
}

function SubmitButton({ status }: { status: ContentStatus }) {
  const { pending } = useFormStatus()
  
  let label = 'Reserve'
  let disabled = pending
  
  if (status === 'reserved') {
    label = 'Reserved'
    disabled = true
  } else if (status === 'archived') {
    label = 'Archived'
    disabled = true
  }
  
  return (
    <Button 
      type="submit" 
      disabled={disabled} 
      variant={disabled && status !== 'available' ? "outline" : "secondary"}
    >
      {pending ? 'Processing...' : label}
    </Button>
  )
}

export function ReserveButton({ contentId, status, userHasReserved, className }: ReserveButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleReserve(formData: FormData) {
    try {
      setIsSubmitting(true)
      const result = await reserveItem(formData)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to reserve item')
        return
      }
      
      toast.success(result.message || 'Item reserved successfully')
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // If user has already reserved this item, don't show the button
  if (userHasReserved) {
    return (
      <Button disabled variant="outline" className={className}>
        Already Reserved
      </Button>
    )
  }

  return (
    <form action={handleReserve} className={className}>
      <input type="hidden" name="contentId" value={contentId} />
      <SubmitButton status={status} />
    </form>
  )
} 