'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, GraduationCap, Sparkles, UserRound } from 'lucide-react'

// Type definitions for better TypeScript support
type Skill = Database['public']['Tables']['skills']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type UserSkillSelection = Pick<Database['public']['Tables']['user_skills_offered']['Row'], 'skill_id'>

interface ProfileFormProps {
  mode: 'create' | 'edit'
  onComplete?: () => void
}

export default function ProfileForm({ mode, onComplete }: ProfileFormProps) {
  // Form state - using individual state variables for better control
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  
  // Skills state - separate arrays for offered vs wanted
  const [skillsOffered, setSkillsOffered] = useState<number[]>([])
  const [skillsWanted, setSkillsWanted] = useState<number[]>([])
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'skills'>('basic')

  const { user, profile, refreshProfile } = useAuth()
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  const fetchSkills = useCallback(async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching skills:', error)
    } else {
      setAvailableSkills(data || [])
    }
  }, [supabase])

  const fetchUserSkills = useCallback(async () => {
    if (!user) return

    // Fetch skills the user offers
    const { data: offeredSkills } = await supabase
      .from('user_skills_offered')
      .select('skill_id')
      .eq('user_id', user.id)

    const { data: wantedSkills } = await supabase
      .from('user_skills_wanted')
      .select('skill_id')
      .eq('user_id', user.id)

    const offeredRows = (offeredSkills || []) as UserSkillSelection[]
    const wantedRows = (wantedSkills || []) as UserSkillSelection[]

    setSkillsOffered(offeredRows.map((skill) => skill.skill_id).filter((id): id is number => Boolean(id)))
    setSkillsWanted(wantedRows.map((skill) => skill.skill_id).filter((id): id is number => Boolean(id)))
  }, [supabase, user])

  // Load available skills on component mount
  useEffect(() => {
    fetchSkills()
    if (mode === 'edit' && profile) {
      // Pre-populate form with existing profile data
      setFullName(profile.full_name || '')
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setLocation(profile.location || '')
      fetchUserSkills()
    }
  }, [fetchSkills, fetchUserSkills, mode, profile])

  const handleSkillToggle = (skillId: number, type: 'offered' | 'wanted') => {
    if (type === 'offered') {
      setSkillsOffered(prev => 
        prev.includes(skillId) 
          ? prev.filter(id => id !== skillId)
          : [...prev, skillId]
      )
    } else {
      setSkillsWanted(prev => 
        prev.includes(skillId)
          ? prev.filter(id => id !== skillId)
          : [...prev, skillId]
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // First, update the profile
      const profileData: ProfileInsert = {
        id: user.id,
        full_name: fullName,
        username: username || null,
        bio: bio || null,
        location: location || null,
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData)

      if (profileError) throw profileError

      // Clear existing skills first
      await supabase
        .from('user_skills_offered')
        .delete()
        .eq('user_id', user.id)

      await supabase
        .from('user_skills_wanted')
        .delete()
        .eq('user_id', user.id)

      // Insert new skills offered
      if (skillsOffered.length > 0) {
        const offeredSkillsData = skillsOffered.map(skillId => ({
          user_id: user.id,
          skill_id: skillId
        }))

        const { error: offeredError } = await supabase
          .from('user_skills_offered')
          .insert(offeredSkillsData)

        if (offeredError) throw offeredError
      }

      // Insert new skills wanted
      if (skillsWanted.length > 0) {
        const wantedSkillsData = skillsWanted.map(skillId => ({
          user_id: user.id,
          skill_id: skillId
        }))

        const { error: wantedError } = await supabase
          .from('user_skills_wanted')
          .insert(wantedSkillsData)

        if (wantedError) throw wantedError
      }

      await refreshProfile()

      if (onComplete) {
        onComplete()
      } else {
        router.push('/dashboard')
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Group skills by category for better UX
  const skillsByCategory = availableSkills.reduce((acc, skill) => {
    const category = skill.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  return (
    <div className="brand-container py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="brand-kicker">{mode === 'create' ? 'Set up your profile' : 'Refresh your profile'}</p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-[var(--brand-ink)] sm:text-5xl">
            {mode === 'create' ? 'Tell people what you can swap' : 'Keep your skill profile current'}
          </h2>
          <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-[var(--brand-muted)]">
            A clear profile helps the right people understand what you can teach, what you want to learn, and how to start a useful exchange.
          </p>
        </div>

        <div className="brand-card p-5 sm:p-8">
          <div className="mb-8 grid grid-cols-2 gap-3 rounded-[8px] bg-[#f2ede4] p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-3 text-sm font-black transition-colors ${
                activeTab === 'basic'
                  ? 'bg-white text-[var(--brand-ink)] shadow-sm'
                  : 'text-[var(--brand-muted)] hover:text-[var(--brand-ink)]'
              }`}
            >
              <UserRound className="h-4 w-4" />
              Basics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('skills')}
              className={`inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-3 text-sm font-black transition-colors ${
                activeTab === 'skills'
                  ? 'bg-white text-[var(--brand-ink)] shadow-sm'
                  : 'text-[var(--brand-muted)] hover:text-[var(--brand-ink)]'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Skills
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="brand-label">
                    Full name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="brand-input px-4 py-3.5"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="username" className="brand-label">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="brand-input px-4 py-3.5"
                    placeholder="Choose a handle people can remember"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="brand-label">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="brand-input px-4 py-3.5"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="brand-label">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="brand-input px-4 py-3.5"
                    placeholder="Share what you are into, what you can help with, and what you want to practise next..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-8">
                <div>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="rounded-full bg-[var(--brand-mint)] p-2 text-[var(--brand-ink)]">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[var(--brand-ink)]">
                        Skills I can offer
                  </h3>
                      <p className="mt-1 text-sm font-medium text-[var(--brand-muted)]">
                        Choose the things you can teach, review, practise, or explain.
                  </p>
                    </div>
                  </div>
                  
                  {Object.entries(skillsByCategory).map(([category, skills]) => (
                    <div key={category} className="mb-6">
                      <h4 className="mb-2 text-sm font-black uppercase text-[var(--brand-muted)]">{category}</h4>
                      <div className="flex flex-wrap gap-2.5">
                        {skills.map(skill => (
                          <button
                            key={`offered-${skill.id}`}
                            type="button"
                            onClick={() => handleSkillToggle(skill.id, 'offered')}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-extrabold transition-colors hover:cursor-pointer ${
                              skillsOffered.includes(skill.id)
                                ? 'border-[var(--brand-ink)] bg-[var(--brand-lime)] text-[var(--brand-ink)]'
                                : 'border-[var(--brand-border)] bg-white text-[var(--brand-muted)] hover:border-[var(--brand-ink)] hover:text-[var(--brand-ink)]'
                            }`}
                          >
                            {skillsOffered.includes(skill.id) && <Check className="h-4 w-4" />}
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="rounded-full bg-[var(--brand-yellow)] p-2 text-[var(--brand-ink)]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[var(--brand-ink)]">
                        Skills I want to learn
                  </h3>
                      <p className="mt-1 text-sm font-medium text-[var(--brand-muted)]">
                        Pick the topics you would like someone else to help you with.
                  </p>
                    </div>
                  </div>
                  
                  {Object.entries(skillsByCategory).map(([category, skills]) => (
                    <div key={category} className="mb-6">
                      <h4 className="mb-2 text-sm font-black uppercase text-[var(--brand-muted)]">{category}</h4>
                      <div className="flex flex-wrap gap-2.5">
                        {skills.map(skill => (
                          <button
                            key={`wanted-${skill.id}`}
                            type="button"
                            onClick={() => handleSkillToggle(skill.id, 'wanted')}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-extrabold transition-colors hover:cursor-pointer ${
                              skillsWanted.includes(skill.id)
                                ? 'border-[var(--brand-blue)] bg-[rgba(10,102,255,0.1)] text-[var(--brand-blue)]'
                                : 'border-[var(--brand-border)] bg-white text-[var(--brand-muted)] hover:border-[var(--brand-ink)] hover:text-[var(--brand-ink)]'
                            }`}
                          >
                            {skillsWanted.includes(skill.id) && <Check className="h-4 w-4" />}
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-[8px] border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              {activeTab === 'skills' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className="brand-button-secondary px-5 py-3 text-sm hover:cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to basics
                </button>
              )}
              
              <div className="ml-auto flex">
                {activeTab === 'basic' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('skills')}
                    className="brand-button-primary px-6 py-3 text-sm hover:cursor-pointer"
                  >
                    Next: skills
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="brand-button-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : mode === 'create' ? 'Complete profile' : 'Update profile'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
