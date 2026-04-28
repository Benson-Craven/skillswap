'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    refreshProfile: async () => {},
    signOut: async () => {},
})

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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({children} : { children: React.ReactNode}) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [supabase] = useState(() => createClient());

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return null
      }

      return data ?? null
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }, [supabase])

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await runWithAuthRetry(() => supabase.auth.getSession())
      
      if (error) {
        console.error('Error fetching session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }
    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (!session?.user) {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    let active = true

    const loadProfile = async () => {
      const nextProfile = await fetchProfile(user.id)

      if (!active) {
        return
      }

      setProfile(nextProfile)
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [fetchProfile, user])

  const refreshProfile = async () => {
    if (user) {
      setProfile(await fetchProfile(user.id))
    }
  }

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    setSession(null)

    const { error } = await runWithAuthRetry(() => supabase.auth.signOut())

    if (error && error.name !== 'AuthSessionMissingError') {
      throw error
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    refreshProfile,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
