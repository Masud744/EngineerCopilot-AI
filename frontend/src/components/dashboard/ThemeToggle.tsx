'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Laptop, Check } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  if (!mounted) {
    return (
      <button
        type="button"
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Toggle theme"
      >
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
    )
  }

  const currentIcon =
    theme === 'system' ? (
      <Laptop className="h-[18px] w-[18px]" strokeWidth={1.75} />
    ) : resolvedTheme === 'dark' ? (
      <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    ) : (
      <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} />
    )

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title={`Theme: ${theme || 'system'} (Click to change)`}
        aria-label="Theme selector"
      >
        {currentIcon}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-card p-1 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
          <div className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
            Appearance
          </div>

          <button
            type="button"
            onClick={() => {
              setTheme('light')
              setIsOpen(false)
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              theme === 'light'
                ? 'bg-accent text-accent-foreground font-semibold'
                : 'text-foreground/80 hover:bg-accent/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="h-4 w-4" strokeWidth={1.75} />
              Light
            </span>
            {theme === 'light' && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('dark')
              setIsOpen(false)
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-accent text-accent-foreground font-semibold'
                : 'text-foreground/80 hover:bg-accent/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="h-4 w-4" strokeWidth={1.75} />
              Dark
            </span>
            {theme === 'dark' && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('system')
              setIsOpen(false)
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              theme === 'system'
                ? 'bg-accent text-accent-foreground font-semibold'
                : 'text-foreground/80 hover:bg-accent/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Laptop className="h-4 w-4" strokeWidth={1.75} />
              System
            </span>
            {theme === 'system' && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
        </div>
      )}
    </div>
  )
}
