'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  const router = useRouter()
  const { loading: authLoading } = useAuth()
  const [supabase] = useState(() => createClient())

  const loading = authLoading || submitting
  const isSignup = mode === 'signup'

  const isSupabaseLockError = (error: unknown) =>
    error instanceof Error &&
    error.message.includes('auth-token') &&
    error.message.includes('stole it')

  const wait = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms)
    })

  const runWithAuthRetry = async <T,>(operation: () => Promise<T>) => {
    try {
      return await operation()
    } catch (error) {
      if (!isSupabaseLockError(error)) {
        throw error
      }

      await wait(150)
      return operation()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'signup') {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            typeof result.error === 'string'
              ? result.error
              : 'Unable to create account. Please try again.'
          )
        }

        if (result.requiresEmailConfirmation) {
          setMessage('Check your email for the confirmation link!')
        } else {
          router.replace('/dashboard')
          router.refresh()
        }
      } else {
        const { error } = await runWithAuthRetry(() =>
          supabase.auth.signInWithPassword({
            email,
            password,
          })
        )

        if (error) throw error

        router.replace('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleAuth = async () => {
    if (loading) return

    setSubmitting(true)
    setError(null)

    try {
      const { error } = await runWithAuthRetry(() =>
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        })
      )

      if (error) throw error
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="brand-container grid min-h-screen items-center gap-10 py-10 lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="hidden lg:block">
        <Link href="/" className="text-2xl font-black text-(--brand-ink)">
          SkillSwap
        </Link>
        <p className="brand-kicker mt-14">{isSignup ? 'Start swapping' : 'Welcome back'}</p>
        <h1 className="mt-4 max-w-xl text-6xl font-black leading-[0.96] text-(--brand-ink)">
          {isSignup ? 'Your next skill starts here' : "Let's get you connected"}
        </h1>
        <p className="mt-6 max-w-lg text-lg font-medium leading-8 text-(--brand-muted)">
          {isSignup
            ? 'Create a profile, list what you can teach, and discover people ready to trade knowledge.'
            : 'Pick up where you left off and keep building your learning network.'}
        </p>
        <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
          {['Career skills', 'Creative practice', 'Language swaps', 'Local know-how'].map((label) => (
            <span key={label} className="brand-pill px-4 py-3 text-sm">
              {label}
            </span>
          ))}
        </div>
      </aside>

      <div className="w-full max-w-md justify-self-center">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <Link href="/" className="text-2xl font-black text-(--brand-ink)">
            SkillSwap
          </Link>
        </div>

        <div className="brand-card p-6 sm:p-8">
          <p className="brand-kicker">{isSignup ? 'Create account' : 'Log in'}</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-(--brand-ink)">
            {mode === 'login' ? 'Sign in to SkillSwap' : 'Join the skill network'}
          </h2>
          <p className="mt-3 text-sm font-medium text-(--brand-muted)">
            {mode === 'login' ? (
              <>
                New here?{' '}
                <Link href="/auth/signup" className="font-extrabold text-(--brand-blue) hover:text-(--brand-blue-dark)">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/auth/login" className="font-extrabold text-(--brand-blue) hover:text-(--brand-blue-dark)">
                  Log in
                </Link>
              </>
            )}
          </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div>
                <label htmlFor="fullName" className="brand-label">
                  Full name
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--brand-muted)" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                    className="brand-input px-12 py-3.5 text-base"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="brand-label">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--brand-muted)" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                  className="brand-input px-12 py-3.5 text-base"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            </div>
            
            <div>
              <label htmlFor="password" className="brand-label">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--brand-muted)" />
              <input
                id="password"
                name="password"
                type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                  className="brand-input px-12 py-3.5 text-base"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="text-sm font-semibold text-red-700">{error}</div>
            </div>
          )}

          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="text-sm font-semibold text-green-800">{message}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
                className="brand-button-primary w-full px-5 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
                {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-(--brand-border)" />
              </div>
              <div className="relative flex justify-center text-sm">
                  <span className="bg-(--brand-surface) px-3 font-bold text-(--brand-muted)">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                  className="brand-button-secondary w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">Google</span>
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
