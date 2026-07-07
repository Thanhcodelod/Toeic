import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { mapAuthError } from './authErrors'

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

export interface SignUpResult {
  error: string | null
  needsConfirmation: boolean
}
export interface AuthActionResult {
  error: string | null
}

export interface AuthContextValue {
  status: AuthStatus
  session: Session | null
  user: User | null
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signIn: (email: string, password: string) => Promise<AuthActionResult>
  signOut: () => Promise<void>
  resendConfirmation: (email: string) => Promise<AuthActionResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('signed-out')
      return
    }
    const supabase = getSupabase()
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setStatus(data.session ? 'signed-in' : 'signed-out')
    })

    // Keep this callback synchronous (setState only) — no supabase calls here.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setStatus(s ? 'signed-in' : 'signed-out')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const signIn = async (email: string, password: string) => {
      const { error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      })
      return { error: mapAuthError(error) }
    }

    const signUp = async (email: string, password: string) => {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      return {
        error: mapAuthError(error),
        needsConfirmation: !error && !data.session,
      }
    }

    const signOut = async () => {
      await getSupabase().auth.signOut()
      // Don't land back on ?day=N after re-login.
      if (typeof window !== 'undefined')
        window.history.replaceState({}, '', '/')
    }

    const resendConfirmation = async (email: string) => {
      const { error } = await getSupabase().auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin },
      })
      return { error: mapAuthError(error) }
    }

    return {
      status,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
      resendConfirmation,
    }
  }, [status, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  return ctx
}
