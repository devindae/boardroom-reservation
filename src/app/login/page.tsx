'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isValidCompanyEmail } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle2, AlertCircle, Key } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const supabase = createClient()

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setErrorMessage('Email address is required.')
      return
    }

    if (!isValidCompanyEmail(cleanEmail)) {
      setErrorMessage('Please use a valid @cba.lk email address.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message)
        setErrorMessage(error.message)
      } else {
        setIsSubmitted(true)
      }
    } catch {
      toast.error('An unexpected error occurred.')
      setErrorMessage('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoSignIn = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@cba.lk',
        password: 'Password123!',
      })

      if (error) {
        setErrorMessage(error.message)
        toast.error(error.message)
      } else {
        toast.success('Signed in as Demo User')
        window.location.href = '/'
      }
    } catch {
      setErrorMessage('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img
            src="/logo.png"
            alt="CBA Logo"
            className="h-28 w-auto object-contain"
          />
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl border border-border p-8 space-y-8">
          {isSubmitted ? (
            <div className="text-center space-y-5 py-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We&apos;ve sent a sign-in link to<br/>
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground text-sm"
                onClick={() => setIsSubmitted(false)}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleSendMagicLink} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@cba.lk"
                      className="pl-10 h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-lg"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errorMessage) setErrorMessage('')
                      }}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-destructive/5 text-destructive text-sm flex items-start gap-2.5 border border-destructive/10">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg shadow-none"
                >
                  {isLoading ? 'Sending...' : 'Sign In'}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <span className="relative px-3 text-xs uppercase bg-card text-muted-foreground">Or</span>
              </div>

              {/* Demo Sign In Button */}
              <Button
                onClick={handleDemoSignIn}
                disabled={isLoading}
                variant="outline"
                className="w-full h-11 border-border text-foreground hover:bg-secondary hover:text-foreground font-medium text-sm rounded-lg shadow-none flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4 text-muted-foreground" />
                Sign In as Demo User
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Meeting Room Reservation System · CBA
        </p>
      </div>
    </div>
  )
}
