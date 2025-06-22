'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { returnItem } from '@/app/actions/borrow'
import { toast } from 'sonner'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" disabled={pending} variant="secondary">
      {pending ? 'Processing...' : 'Return'}
    </Button>
  )
}

interface ReturnButtonProps {
  borrowId: number
  className?: string
}

export function ReturnButton({ borrowId, className }: ReturnButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleReturn(formData: FormData) {
    try {
      setIsSubmitting(true)
      const result = await returnItem(formData)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to return item')
        return
      }
      
      toast.success(result.message || 'Item returned successfully')
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleReturn} className={className}>
      <input type="hidden" name="borrowId" value={borrowId} />
      <SubmitButton />
    </form>
  )
} 