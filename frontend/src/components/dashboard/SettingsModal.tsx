'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  X,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Check,
  Briefcase,
  Sparkles,
  User,
  Shield,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string | null
  userName?: string | null
  onLogout?: () => void
}

export function SettingsModal({
  isOpen,
  onClose,
  userEmail,
  userName,
  onLogout,
}: SettingsModalProps) {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'general' | 'jobs' | 'ai' | 'account'>('general')
  const [savedNotice, setSavedNotice] = useState(false)

  // Local preferences state
  const [autoRefreshJobs, setAutoRefreshJobs] = useState(true)
  const [atsThreshold, setAtsThreshold] = useState(70)
  const [salaryCurrency, setSalaryCurrency] = useState('BDT')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSave = () => {
    setSavedNotice(true)
    setTimeout(() => {
      setSavedNotice(false)
      onClose()
    }, 900)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Settings & Preferences</h2>
              <p className="text-xs text-muted-foreground">Manage your experience, appearance, and career matching</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content with Sidebar Tabs */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Tab Navigation */}
          <div className="w-full sm:w-48 border-b sm:border-b-0 sm:border-r border-border/60 p-3 space-y-1 bg-muted/20 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'general'
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              Appearance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'jobs'
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Job Preferences
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'ai'
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI & ATS Studio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'account'
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Account
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Theme & Color Scheme</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Choose how সম্ভব (Shombhob) looks to you across all dashboard devices.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border transition-all text-xs font-medium ${
                        theme === 'light'
                          ? 'border-primary bg-primary/5 text-foreground font-semibold ring-2 ring-primary/20'
                          : 'border-border/80 hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <Sun className="h-5 w-5" />
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border transition-all text-xs font-medium ${
                        theme === 'dark'
                          ? 'border-primary bg-primary/5 text-foreground font-semibold ring-2 ring-primary/20'
                          : 'border-border/80 hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <Moon className="h-5 w-5" />
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border transition-all text-xs font-medium ${
                        theme === 'system'
                          ? 'border-primary bg-primary/5 text-foreground font-semibold ring-2 ring-primary/20'
                          : 'border-border/80 hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <Laptop className="h-5 w-5" />
                      System
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Auto-Refresh Job Board</p>
                      <p className="text-[11px] text-muted-foreground">Keep engineering positions synced in background</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoRefreshJobs}
                      onChange={(e) => setAutoRefreshJobs(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Preferred Salary Currency</h3>
                  <p className="text-xs text-muted-foreground mb-2">Display salary ranges in your preferred currency</p>
                  <select
                    value={salaryCurrency}
                    onChange={(e) => setSalaryCurrency(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="BDT">BDT (৳) — Bangladesh Taka</option>
                    <option value="USD">USD ($) — US Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Target Engineering Tracks</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Embedded Systems & IoT', 'AI / ML & Computer Vision', 'Robotics & Automation', 'Full Stack Engineering'].map((track) => (
                      <div key={track} className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-muted/20 text-xs text-foreground">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        {track}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border/80 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      LLM Engines Active
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                      Online
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Powered by <strong>Google Gemini 2.5 Flash</strong> with <strong>Groq LLaMA 3.3</strong> instant failover. Optimized for ATS bullet points and parsing.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">ATS Target Match Score</span>
                    <span className="text-xs font-bold text-primary">{atsThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={atsThreshold}
                    onChange={(e) => setAtsThreshold(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Highlight keyword recommendations when alignment is below this percentage.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-foreground">
                    {(userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{userName || 'Engineer'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{userEmail || 'user@email.com'}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-2"
                    onClick={onLogout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out of Session
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 px-6 py-3.5 bg-muted/30">
          <span className="text-[11px] text-muted-foreground">
            {savedNotice ? '✓ Preferences saved successfully' : 'Changes apply immediately'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
            <Button size="sm" onClick={handleSave} className="text-xs">
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
