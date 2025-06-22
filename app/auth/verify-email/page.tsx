import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResendVerificationButton } from '@/components/auth/resend-verification-button'

export default function VerifyEmailPage() {
  return (
    <div className="h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We've sent you a verification email. Please check your inbox and click the verification link to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            If you don't see the email, check your spam folder.
          </p>
          <ResendVerificationButton />
        </CardContent>
      </Card>
    </div>
  )
} 