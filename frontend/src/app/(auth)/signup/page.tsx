'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Cpu, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      }
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
      // Note: Supabase will auto-login if email confirmation is disabled,
      // or will require the user to check their email if enabled.
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r border-border/50">
        <div className="absolute inset-0 bg-zinc-950">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-primary/5 to-background" />
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Cpu className="mr-2 h-6 w-6 text-primary" />
          EngineerCopilot AI
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Join thousands of engineers discovering top-tier roles in IoT, Robotics, and Deep Learning without the noise of generic job boards.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 flex items-center justify-center h-full">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card className="border-border/50 glass-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Create an account</CardTitle>
              <CardDescription className="text-center">
                Enter your email below to create your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignup}>
              <CardContent className="grid gap-4">
                {error && (
                  <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive border border-destructive/20 text-center">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 text-sm rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 text-center">
                    Check your email for the confirmation link to complete registration.
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || success}
                    className="bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || success}
                    className="bg-background/50"
                  />
                </div>
                <Button className="w-full mt-2" type="submit" disabled={isLoading || success}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>
              </CardContent>
            </form>
            <CardFooter>
              <div className="text-center text-sm text-muted-foreground mt-2 w-full">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
