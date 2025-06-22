import { createServerClient } from '@/utils/supabase/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { 
  Home, 
  BookOpen, 
  Clock, 
  User,
  Menu, 
} from 'lucide-react'

export const metadata = {
  title: 'Dashboard | Library Management System',
  description: 'User dashboard for library management system',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()
  
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: 'Content Library',
      href: '/dashboard/content',
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: 'My Borrowed Items',
      href: '/dashboard/borrowed',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      name: 'My Profile',
      href: '/dashboard/profile',
      icon: <User className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile navigation header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background p-4 md:hidden">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6" />
          <span className="font-bold">Library MS</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <details className="relative">
            <summary className="list-none">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </summary>
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-background shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="p-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
                <div className="border-t my-1"></div>
                <div className="px-3 py-2">
                  <SignOutButton className="w-full justify-start" variant="ghost" />
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <aside className="hidden w-64 flex-col border-r bg-background md:flex">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6" />
              <span className="font-bold">Library MS</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t p-4">
            <div className="space-y-2">
              {profile?.role === 'admin' && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin">Admin Dashboard</Link>
                </Button>
              )}
              <SignOutButton className="w-full" />
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
} 