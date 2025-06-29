import { UpdatePasswordForm } from '@/components/auth/update-password-form'

export default function UpdatePasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <UpdatePasswordForm />
      </div>
    </div>
  )
} 