'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { borrowItem } from '@/app/actions/borrow'
import { toast } from 'sonner'
import { ContentStatus } from '@/utils/supabase/database.types'

function SubmitButton({ status }: { status: ContentStatus }) {
  const { pending } = useFormStatus()
  
  let label = 'Borrow'
  let disabled = pending
  
  if (status === 'borrowed') {
    label = 'Borrowed'
    disabled = true
  } else if (status === 'reserved') {
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
      variant={disabled && status !== 'available' ? "outline" : "default"}
    >
      {pending ? 'Processing...' : label}
    </Button>
  )
}

interface BorrowButtonProps {
  contentId: number
  status: ContentStatus
  userHasBorrowed: boolean
  className?: string
}

export function BorrowButton({ contentId, status, userHasBorrowed, className }: BorrowButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleBorrow(formData: FormData) {
    try {
      setIsSubmitting(true)
      const result = await borrowItem(formData)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to borrow item')
        return
      }
      
      toast.success(result.message || 'Item borrowed successfully')
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // If user has already borrowed this item, don't show the button
  if (userHasBorrowed) {
    return (
      <Button disabled variant="outline" className={className}>
        Already Borrowed
      </Button>
    )
  }

  return (
    <form action={handleBorrow} className={className}>
      <input type="hidden" name="contentId" value={contentId} />
      <SubmitButton status={status} />
    </form>
  )
} 