'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signIn } from '@/app/actions/auth'
import { signInSchema } from '@/lib/validations/auth'
import { toast } from "sonner"
import { motion } from "framer-motion"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button 
      type="submit" 
      className="w-full transition-all duration-200 hover:scale-[1.02]" 
      size="lg"
      disabled={pending}
    >
      {pending ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Signing in...
        </div>
      ) : (
        'Sign In'
      )}
    </Button>
  )
}

export function SignInForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    try {
      // Client-side validation
      const validatedFields = signInSchema.parse({
        email: formData.get('email'),
        password: formData.get('password'),
      })

      const result = await signIn(formData)
      
      if (result && 'type' in result) {
        setError(result.message)
        toast.error(result.message)
      } else if (result && 'success' in result) {
        toast.success('Sign in successful')
        router.push('/dashboard')
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
        toast.error(error.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
        toast.error('An unexpected error occurred. Please try again.')
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full backdrop-blur-sm bg-white/80 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-600 text-center w-full">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline transition-colors">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
} 