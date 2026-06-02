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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r border-border/50">
        <div className="absolute inset-0 bg-zinc-950">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-primary/5 to-background" />
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Cpu className="mr-2 h-6 w-6 text-primary" />
          EngineerCopilot AI
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This platform completely transformed my job search. The ATS resume generator and AI cover letters helped me land a Senior Embedded role at a top-tier robotics company.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">Tariq M., Embedded Systems Engineer</footer>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 flex items-center justify-center h-full">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card className="border-border/50 glass-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">
                Enter your email to sign in to your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="grid gap-4">
                {error && (
                  <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive border border-destructive/20 text-center">
                    {error}
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
                    disabled={isLoading}
                    className="bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-muted-foreground">
                      Forgot your password?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-background/50"
                  />
                </div>
                <Button className="w-full mt-2" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </CardContent>
            </form>
            <CardFooter>
              <div className="text-center text-sm text-muted-foreground mt-2 w-full">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
