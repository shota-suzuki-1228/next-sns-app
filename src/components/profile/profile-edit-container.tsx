'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileEditForm } from './profile-edit-form'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ProfileEditContainerProps {
  profile: Profile
}

export function ProfileEditContainer({ profile }: ProfileEditContainerProps) {
  const [currentProfile, setCurrentProfile] = useState(profile)
  const router = useRouter()

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setCurrentProfile(updatedProfile)
    
    // プロフィール更新後、少し待ってからプロフィールページにリダイレクト
    setTimeout(() => {
      router.push(`/profile/${updatedProfile.username}`)
    }, 2000)
  }

  return (
    <ProfileEditForm 
      profile={currentProfile} 
      onUpdate={handleProfileUpdate}
    />
  )
}