'use client'

import { useState, useEffect } from 'react'
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
  Settings,
  Bell,
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
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserEmail(session.user.email || null)
          setUserName(
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] || null
          )
        }
      } catch { /* silent */ }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard/jobs')) return 'Find Jobs'
    return SIDEBAR_ITEMS.find((item) => item.href === pathname)?.name || 'Dashboard'
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-card border-r border-border/50" suppressHydrationWarning>
      {/* Logo */}
      <div className="flex h-[72px] items-center px-5 border-b border-border/60">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/60 bg-primary/10">
            <Cpu className="h-5 w-5 text-primary" />
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-tight">
              Engineer<span className="text-primary">Copilot</span>
            </span>
            <span className="block text-[10px] text-muted-foreground leading-tight">
              Find, Prepare, Apply, Grow.
            </span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-3">
        <nav className="grid items-start px-3 space-y-0.5">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground border-l-2 border-transparent'
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-primary' : ''}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile + Logout */}
      <div className="border-t border-border/50 p-3 mt-auto">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">
              {(userName || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">
              {userName || 'User'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {userEmail || 'user@email.com'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  const isJobsPage = pathname === '/dashboard/jobs';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-3/4 max-w-[280px] bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-10"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden border-r border-border/60 bg-card md:block md:w-[240px] md:fixed md:inset-y-0 md:h-screen">
        <Sidebar />
      </div>

      {/* Main Content Wrapper */}
      <div className="flex flex-col md:pl-[240px] flex-1 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border/40 bg-background/95 px-4 lg:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation</span>
          </Button>

          <div className="flex-1 text-sm font-medium text-muted-foreground">
            {getPageTitle()}
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Settings">
              <Settings className="h-[18px] w-[18px]" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative" title="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <Link
              href="/dashboard/profile"
              className="ml-1 h-8 w-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center hover:bg-primary/25 transition-colors"
            >
              <User className="h-4 w-4 text-primary" />
            </Link>
          </div>
        </header>

        <main
          className={
            isJobsPage
              ? 'flex-1 bg-background px-4 py-3 lg:px-6 lg:py-4 overflow-hidden flex flex-col min-h-0'
              : 'flex-1 bg-background p-4 lg:p-6 overflow-y-auto'
          }
        >
          {children}
        </main>
      </div>
    </div>
  )
}
