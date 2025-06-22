'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { toast } from 'sonner'

interface SignOutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export function SignOutButton({ 
  showIcon = true, 
  children, 
  variant,
  size,
  className
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignOut() {
    try {
      setIsLoading(true)
      await signOut()
    } catch (error) {
      setIsLoading(false)
      toast.error('Failed to sign out')
      console.error(error)
    }
  }

  return (
    <form action={handleSignOut}>
      <Button 
        type="submit" 
        disabled={isLoading}
        variant={variant}
        size={size}
        className={className}
      >
        {showIcon && <LogOut className="mr-2 h-4 w-4" />}
        {children || 'Sign Out'}
      </Button>
    </form>
  )
} 