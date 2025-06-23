import { createServerClient } from '@/utils/supabase/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Home,
  Menu, 
  Shield,
  Link as LinkIcon
} from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard | Library Management System',
  description: 'Manage users, content, and system settings',
}

function NavLink({ href, icon, name, isActive }: { href: string; icon: React.ReactNode; name: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
        isActive ? "bg-accent/50 text-accent-foreground font-medium" : "text-muted-foreground"
      )}
    >
      {icon}
      <span>{name}</span>
    </Link>
  )
}

function SidebarContent({ pathname, navItems }: { 
  pathname: string; 
  navItems: Array<{ name: string; href: string; icon: React.ReactNode }>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold">Admin Dashboard</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              name={item.name}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="grid gap-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Main Dashboard
            </Link>
          </Button>
          <SignOutButton className="w-full justify-start" />
        </div>
      </div>
    </div>
  )
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
      name: 'Overview',
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
    // {
    //   name: 'Integrations',
    //   href: '/admin/integrations',
    //   icon: <LinkIcon className="h-5 w-5" />,
    // },
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
    <div className="min-h-screen bg-background">
      {/* Mobile navigation header */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6 text-primary" />
          <span>Admin</span>
        </Link>
        <div className="flex-1" />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation</span>
              </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <SidebarContent pathname="/admin" navItems={navItems} />
          </SheetContent>
        </Sheet>
      </header>
      
      <div className="flex">
        {/* Fixed sidebar for desktop */}
        <aside className="fixed hidden h-screen w-[300px] bg-white border-r lg:block">
          <SidebarContent pathname="/admin" navItems={navItems} />
        </aside>
        
        {/* Main content */}
        <main className="flex-1 lg:pl-[300px]">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 