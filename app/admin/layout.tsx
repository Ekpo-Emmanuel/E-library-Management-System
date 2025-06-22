import { createServerClient } from '@/utils/supabase/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Home,
  Menu, 
  Shield
} from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard | Library Management System',
  description: 'Manage users, content, and system settings',
}

export default async function AdminLayout({
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
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Check if user is an admin
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }
  
  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Content Management',
      href: '/admin/content',
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: 'Integrations',
      href: '/admin/integrations',
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile navigation header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background p-4 md:hidden">
        <Link href="/admin" className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <span className="font-bold">Admin</span>
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
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Home className="h-5 w-5" />
                    <span>Back to Dashboard</span>
                  </Link>
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
            <Link href="/admin" className="flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <span className="font-bold">Admin Dashboard</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto p-4">
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
          </nav>
          <div className="border-t p-4">
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Back to Main Dashboard
              </Link>
              <SignOutButton className="w-full" variant="outline" />
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
} 