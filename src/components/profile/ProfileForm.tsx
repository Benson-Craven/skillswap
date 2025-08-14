'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'

// Type definitions for better TypeScript support
type Skill = Database['public']['Tables']['skills']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

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

  const { user, profile } = useAuth()
  const supabase = createClient()
  const router = useRouter()

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
  }, [mode, profile])

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching skills:', error)
    } else {
      setAvailableSkills(data || [])
    }
  }

  const fetchUserSkills = async () => {
    if (!user) return

    // Fetch skills the user offers
    const { data: offeredSkills } = await supabase
      .from('user_skills_offered')
      .select('skill_id')
      .eq('user_id', user.id)

    // Fetch skills the user wants
    const { data: wantedSkills } = await supabase
      .from('user_skills_wanted')
      .select('skill_id')
      .eq('user_id', user.id)

    setSkillsOffered(offeredSkills?.map(s => s.skill_id!).filter(Boolean) || [])
    setSkillsWanted(wantedSkills?.map(s => s.skill_id!).filter(Boolean) || [])
  }

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

      // Success! Handle completion
      if (onComplete) {
        onComplete()
      } else {
        router.push('/dashboard')
      }

    } catch (error: any) {
      setError(error.message)
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {mode === 'create' ? 'Complete Your Profile' : 'Edit Profile'}
          </h2>

          {/* Tab Navigation */}
          <div className="flex border-b mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'basic'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('skills')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ml-8 ${
                activeTab === 'skills'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Skills
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-500 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-500 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="text-gray-600 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Choose a unique username"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-500 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="text-gray-600 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-500 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="text-gray-600 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell others about yourself, your interests, and what you're looking for..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-8">
                {/* Skills I Can Offer */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Skills I Can Offer
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select the skills you can teach or help others with
                  </p>
                  
                  {Object.entries(skillsByCategory).map(([category, skills]) => (
                    <div key={category} className="mb-6">
                      <h4 className="font-medium text-gray-800 mb-2 ">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                          <button
                            key={`offered-${skill.id}`}
                            type="button"
                            onClick={() => handleSkillToggle(skill.id, 'offered')}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors hover:cursor-pointer ${
                              skillsOffered.includes(skill.id)
                                ? 'bg-green-100 border-green-500 text-green-800'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Skills I Want to Learn */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Skills I Want to Learn
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select the skills you'd like to learn from others
                  </p>
                  
                  {Object.entries(skillsByCategory).map(([category, skills]) => (
                    <div key={category} className="mb-6">
                      <h4 className="font-medium text-gray-800 mb-2">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                          <button
                            key={`wanted-${skill.id}`}
                            type="button"
                            onClick={() => handleSkillToggle(skill.id, 'wanted')}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors hover:cursor-pointer ${
                              skillsWanted.includes(skill.id)
                                ? 'bg-blue-100 border-blue-500 text-blue-800'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
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
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              {activeTab === 'skills' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:cursor-pointer"
                >
                  ← Back to Basic Info
                </button>
              )}
              
              <div className="flex space-x-4 ml-auto">
                {activeTab === 'basic' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('skills')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors hover:cursor-pointer"
                  >
                    Next: Skills →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : mode === 'create' ? 'Complete Profile' : 'Update Profile'}
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