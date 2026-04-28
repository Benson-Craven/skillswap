'use client'

import ProfileForm from '@/components/profile/ProfileForm'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useRouter } from 'next/navigation'

export default function ProfileSetupPage() {
  const router = useRouter()

  const handleComplete = () => {
    router.push('/dashboard')
    router.refresh() // Refresh to get updated profile data
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <ProfileForm mode="create" onComplete={handleComplete} />
      </div>
    </ProtectedRoute>
  )
}
