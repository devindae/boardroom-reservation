'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isValidCompanyEmail } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      setErrorMessage('Please fill in all fields.')
      return
    }

    if (!isValidCompanyEmail(cleanEmail)) {
      setErrorMessage('Please use a valid @cba.lk email address.')
      return
    }

    if (isSignUp && !name.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)

    try {
      if (isSignUp) {
        // Sign Up
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        })

        if (error) {
          setErrorMessage(error.message)
          toast.error(error.message)
        } else {
          setIsSuccess(true)
          toast.success('Registration successful!')
        }
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        })

        if (error) {
          setErrorMessage(error.message)
          toast.error(error.message)
        } else {
          toast.success('Successfully signed in!')
          window.location.href = '/'
        }
      }
    } catch {
      setErrorMessage('An unexpected error occurred.')
      toast.error('An unexpected error occurred.')
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
        <div className="bg-card rounded-xl border border-border p-8 space-y-6 shadow-xl shadow-slate-100 dark:shadow-none">
          {isSuccess ? (
            <div className="text-center space-y-5 py-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Registration Successful</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your account has been created. You can now sign in with your email and password.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full h-11 border-border text-foreground hover:bg-secondary rounded-lg"
                onClick={() => {
                  setIsSuccess(false)
                  setIsSignUp(false)
                  setPassword('')
                }}
              >
                Go to Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1.5 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  {isSignUp ? 'Create an Account' : 'Welcome Back'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? 'Sign up with your corporate email' : 'Sign in to reserve meeting rooms'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {/* Full Name (Sign Up only) */}
                {isSignUp && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10 h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-lg"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
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

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-lg"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
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
                  {isLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </Button>
              </form>

              {/* Toggle Sign In / Sign Up */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setErrorMessage('')
                  }}
                  className="text-sm font-medium text-primary hover:underline transition-all"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
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
