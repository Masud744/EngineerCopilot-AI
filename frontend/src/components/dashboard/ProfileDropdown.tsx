'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, FileText, Bookmark, Settings, LogOut, CheckCircle2 } from 'lucide-react'

interface ProfileDropdownProps {
  userName: string | null
  userEmail: string | null
  onOpenSettings: () => void
  onLogout: () => void
}

export function ProfileDropdown({
  userName,
  userEmail,
  onOpenSettings,
  onLogout,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const initial = (userName || userEmail || 'U').charAt(0).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1 h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center hover:ring-2 hover:ring-primary/30 transition-all text-xs font-semibold text-white cursor-pointer"
        title="Account Menu"
        aria-label="User Account Menu"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-border bg-card p-1.5 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
          {/* User Info */}
          <div className="px-3 py-2.5 border-b border-border/60 mb-1">
            <p className="text-xs font-semibold text-foreground truncate">
              {userName || 'Engineering Candidate'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {userEmail || 'masud.nl74@gmail.com'}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium mt-1.5">
              <CheckCircle2 className="h-3 w-3" />
              Active Candidate Account
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-0.5">
            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground/85 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Profile & Master Resume
            </Link>

            <Link
              href="/dashboard/applications"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground/85 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Applications Pipeline
            </Link>

            <Link
              href="/dashboard/saved-jobs"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground/85 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
            >
              <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
              Saved Job Bookmarks
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onOpenSettings()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground/85 rounded-lg hover:bg-muted hover:text-foreground transition-colors text-left"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              Settings & Preferences
            </button>
          </div>

          {/* Divider & Sign Out */}
          <div className="border-t border-border/60 mt-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onLogout()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors text-left"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
