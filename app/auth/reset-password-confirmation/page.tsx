import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ResetPasswordConfirmationPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent you a password reset link. Please check your email to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            If you don't see the email, check your spam folder.
          </p>
          <Button asChild variant="outline">
            <Link href="/auth/signin">Return to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 