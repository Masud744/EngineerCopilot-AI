'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  Briefcase,
  Sparkles,
  X,
  Trash2,
} from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  link?: string
  icon: 'resume' | 'job' | 'system'
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Resume Analyzed & Active',
    message: 'Your master resume has been parsed with 62 technical skills and project metrics.',
    time: 'Just now',
    read: false,
    link: '/dashboard/profile',
    icon: 'resume',
  },
  {
    id: 'n-2',
    title: '568 Jobs Live in Database',
    message: 'New IoT, Embedded, AI/ML, and Software engineering listings are ready for exploration.',
    time: '1h ago',
    read: false,
    link: '/dashboard/jobs',
    icon: 'job',
  },
  {
    id: 'n-3',
    title: 'Welcome to সম্ভব (Shombhob)',
    message: 'Start by browsing tailored job matches or generate tailored ATS resumes in 1 click.',
    time: 'Today',
    read: true,
    link: '/dashboard',
    icon: 'system',
  },
]

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const renderIcon = (type: NotificationItem['icon']) => {
    switch (type) {
      case 'resume':
        return <FileText className="h-4 w-4 text-emerald-400" />
      case 'job':
        return <Briefcase className="h-4 w-4 text-blue-400" />
      case 'system':
      default:
        return <Sparkles className="h-4 w-4 text-amber-400" />
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card p-0 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-muted/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs font-semibold text-foreground">All caught up!</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  No new notifications at this time.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer relative group ${
                    item.read
                      ? 'hover:bg-muted/40 opacity-75'
                      : 'bg-muted/20 hover:bg-muted/50 font-normal'
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-card border border-border/80 flex items-center justify-center shrink-0 mt-0.5">
                    {renderIcon(item.icon)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs ${item.read ? 'text-foreground' : 'font-semibold text-foreground'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {item.message}
                    </p>
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-block text-[11px] text-primary hover:underline font-medium mt-1"
                      >
                        View details →
                      </Link>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => deleteNotification(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1 transition-opacity"
                    title="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
