'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowRight, BookOpen, BriefcaseBusiness, MapPin, Search, Sparkles, Users } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[var(--brand-border)] border-b-[var(--brand-blue)]"></div>
      </div>
    )
  }

  // Don't render homepage if user is logged in (they're being redirected)
  if (user) {
    return null
  }

  return (
    <main className="min-h-screen">
      <nav className="brand-nav">
        <div className="brand-container flex h-20 items-center justify-between">
          <Link href="/" className="text-2xl font-black text-[var(--brand-ink)]">
            SkillSwap
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden text-sm font-extrabold text-[var(--brand-ink)] transition-colors hover:text-[var(--brand-blue)] sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="brand-button-primary px-5 py-2.5 text-sm"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <section className="brand-container grid min-h-[calc(100vh-80px)] items-center gap-12 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
        <div>
          <span className="brand-pill mb-7 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-[var(--brand-blue)]" />
            The local network for learning by doing
          </span>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.96] text-[var(--brand-ink)] sm:text-6xl lg:text-7xl">
            Let&apos;s find your next skill
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-[var(--brand-muted)] sm:text-xl">
            Meet people nearby who can teach what you want to learn, from practical career skills to creative side quests. Bring what you know. Leave with what you need next.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link 
            href="/auth/signup"
              className="brand-button-primary px-6 py-3.5 text-base"
          >
              Get started
              <ArrowRight className="h-5 w-5" />
          </Link>
          <Link 
            href="/auth/login"
              className="brand-button-secondary px-6 py-3.5 text-base"
          >
              Log in
          </Link>
        </div>

          <div className="mt-9 flex flex-wrap gap-3">
            {['Design critique', 'Interview practice', 'Spanish basics', 'No-code tools'].map((suggestion) => (
              <span key={suggestion} className="brand-pill px-4 py-2 text-sm">
                {suggestion}
              </span>
            ))}
          </div>
        </div>

        <div className="brand-card p-4 sm:p-5">
          <div className="rounded-[8px] border border-[var(--brand-border)] bg-[#101426] p-4 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#c8f6df]">Skill search</p>
                <h2 className="mt-1 text-2xl font-black">Find people ready to swap</h2>
              </div>
              <div className="rounded-full bg-[var(--brand-lime)] p-3 text-[var(--brand-ink)]">
                <Search className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 rounded-[8px] bg-white p-3 text-[var(--brand-ink)]">
              <p className="text-xs font-black uppercase text-[var(--brand-muted)]">I want to learn</p>
              <p className="mt-1 text-lg font-black">Presentation storytelling</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { icon: Users, title: 'Learn together', copy: 'Swap sessions with people who share your pace.', tone: 'bg-[var(--brand-mint)]' },
              { icon: BriefcaseBusiness, title: 'Build useful skills', copy: 'Practise the things that move your work forward.', tone: 'bg-[var(--brand-yellow)]' },
              { icon: MapPin, title: 'Nearby or remote', copy: 'Find local meetups or easy online exchanges.', tone: 'bg-[var(--brand-coral)]' },
              { icon: BookOpen, title: 'Keep growing', copy: 'Turn your knowledge into momentum for someone else.', tone: 'bg-[var(--brand-lime)]' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="brand-card-flat p-4">
                  <div className={`mb-5 inline-flex rounded-full ${item.tone} p-2 text-[var(--brand-ink)]`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-black text-[var(--brand-ink)]">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-[var(--brand-muted)]">{item.copy}</p>
                </article>
              )
            })}
          </div>
      </div>
      </section>
    </main>
  )
}
