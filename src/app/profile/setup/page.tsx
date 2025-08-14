'use client'

import ProfileForm from '@/components/profile/ProfileForm'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/lib/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function ProfileSetupPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const handleComplete = () => {
    router.push('/dashboard')
    router.refresh() // Refresh to get updated profile data
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <ProfileForm mode="create" onComplete={handleComplete} />
      </div>
    </ProtectedRoute>
  )
}