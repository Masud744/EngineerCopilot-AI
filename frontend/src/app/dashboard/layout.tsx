'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Cpu,
  FileText,
  Home,
  LogOut,
  Menu,
  Sparkles,
  User,
  X,
  Briefcase,
  Bookmark,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const SIDEBAR_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Find Jobs', href: '/dashboard/jobs', icon: Briefcase },
  { name: 'Saved Jobs', href: '/dashboard/saved-jobs', icon: Bookmark },
  { name: 'Applications', href: '/dashboard/applications', icon: FileText },
  { name: 'Resume', href: '/dashboard/resume', icon: Sparkles },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-card border-r border-border/50" suppressHydrationWarning>
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <Link href="/" className="flex items-center space-x-2">
          <Cpu className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-tight text-lg">EngineerCopilot</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-border/50">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4" 
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block md:w-64 md:fixed md:inset-y-0">
        <Sidebar />
      </div>

      {/* Main content wrapper */}
      <div className="flex flex-col md:pl-64 flex-1">
        <header className="flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
          <div className="w-full flex-1">
            {/* Can add global search here */}
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
