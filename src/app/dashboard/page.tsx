'use client'

import { useAuth } from '@/lib/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const [hasSkills, setHasSkills] = useState<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkUserSkills()
  }, [user])

  const checkUserSkills = async () => {
    if (!user) return

    const { data: offeredSkills } = await supabase
      .from('user_skills_offered')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    setHasSkills((offeredSkills?.length || 0) > 0)
  }

  const isProfileComplete = profile?.full_name && profile?.bio && hasSkills

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">SkillSwap</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {profile?.full_name || user?.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {!isProfileComplete ? (
              // Profile completion prompt
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 text-sm font-medium">!</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      Complete Your Profile
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Add your skills and bio to start connecting with other users for skill swaps.
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/profile/setup"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Complete Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Complete profile - show dashboard content
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Welcome back, {profile?.full_name}! 👋
                </h2>
                <p className="text-gray-600">
                  Your profile is complete. Ready to start swapping skills?
                </p>
                <div className="mt-4 space-x-4">
                  <Link
                    href="/skills/browse"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Browse Skills
                  </Link>
                  <Link
                    href="/profile/edit"
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Profile Status</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {isProfileComplete ? '✅ Complete' : '⏳ In Progress'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Skills Offered</h3>
                <p className="text-2xl font-semibold text-green-600">
                  {hasSkills ? '🎯 Ready' : '📝 Add Skills'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Connections</h3>
                <p className="text-2xl font-semibold text-blue-600">
                  🚀 Coming Soon
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}