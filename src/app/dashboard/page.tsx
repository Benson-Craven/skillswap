'use client'

import { useAuth } from '@/lib/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, CheckCircle2, LogOut, Pencil, Sparkles, Users } from 'lucide-react'

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const [hasSkills, setHasSkills] = useState<boolean | null>(null)
  const [supabase] = useState(() => createClient())
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUserSkills = async () => {
      if (!user) {
        setHasSkills(false)
        return
      }

      const { data: offeredSkills, error } = await supabase
        .from('user_skills_offered')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (error) {
        console.error('Error checking user skills:', error)
        setHasSkills(false)
        return
      }

      setHasSkills((offeredSkills?.length || 0) > 0)
    }

    checkUserSkills()
  }, [supabase, user])

  const isProfileComplete = profile?.full_name && profile?.bio && hasSkills

  const handleSignOut = async () => {
    if (signingOut) return

    setSigningOut(true)

    try {
      await signOut()
      router.replace('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      setSigningOut(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <nav className="brand-nav">
          <div className="brand-container">
            <div className="flex h-20 justify-between">
              <div className="flex items-center">
                <h1 className="text-2xl font-black text-(--brand-ink)">SkillSwap</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden text-sm font-bold text-(--brand-muted) sm:inline">
                  {profile?.full_name || user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="brand-button-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {signingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="brand-container py-8 sm:py-12">
          <div className="mb-8">
            <p className="brand-kicker">Your SkillSwap home</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-(--brand-ink) sm:text-5xl">
              {isProfileComplete ? `Welcome back, ${profile?.full_name}` : 'Build a profile people can say yes to'}
            </h2>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-(--brand-muted)">
              {isProfileComplete
                ? 'Keep your skills current, find useful exchanges, and turn everyday know-how into real momentum.'
                : 'Add what you can teach, what you want to learn, and the story that helps the right people find you.'}
            </p>
          </div>

            {!isProfileComplete ? (
              <div className="brand-card mb-8 p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--brand-yellow) text-(--brand-ink)">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-(--brand-ink)">
                      Complete your profile
                    </h3>
                    <p className="mt-2 max-w-2xl text-base font-medium leading-7 text-(--brand-muted)">
                      Add your skills and bio to start getting matched with people who want to learn, practise, and trade knowledge.
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/profile/setup"
                        className="brand-button-primary px-5 py-3 text-sm"
                      >
                        Complete Profile
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="brand-card mb-8 p-6 sm:p-8">
                <h3 className="text-2xl font-black text-(--brand-ink)">
                  Your profile is ready
                </h3>
                <p className="mt-2 text-base font-medium leading-7 text-(--brand-muted)">
                  You can start browsing swaps, or tune your profile so the right people find you faster.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/skills/browse"
                    className="brand-button-primary px-5 py-3 text-sm"
                  >
                    Browse Skills
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/profile/edit"
                    className="brand-button-secondary px-5 py-3 text-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="brand-card-flat p-6">
                <CheckCircle2 className="mb-5 h-7 w-7 text-(--brand-blue)" />
                <h3 className="text-sm font-black uppercase text-(--brand-muted)">Profile Status</h3>
                <p className="mt-2 text-2xl font-black text-(--brand-ink)">
                  {isProfileComplete ? 'Complete' : 'In progress'}
                </p>
              </div>
              
              <div className="brand-card-flat p-6">
                <BookOpen className="mb-5 h-7 w-7 text-(--brand-blue)" />
                <h3 className="text-sm font-black uppercase text-(--brand-muted)">Skills Offered</h3>
                <p className="mt-2 text-2xl font-black text-(--brand-ink)">
                  {hasSkills ? 'Ready' : 'Add skills'}
                </p>
              </div>
              
              <div className="brand-card-flat p-6">
                <Users className="mb-5 h-7 w-7 text-(--brand-blue)" />
                <h3 className="text-sm font-black uppercase text-(--brand-muted)">Connections</h3>
                <p className="mt-2 text-2xl font-black text-(--brand-ink)">
                  Coming soon
                </p>
              </div>
            </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
