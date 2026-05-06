import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'

type User = { id: string; name: string; email: string }

type AuthState = {
  ready: boolean
  user: User | null
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

function setAuthHeader(token: string | null) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}

export function AuthProvider(props: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const saved = localStorage.getItem('accessToken')
        if (saved) {
          setAccessToken(saved)
          setAuthHeader(saved)
          try {
            const { data } = await api.get<{ user: User }>('/auth/me')
            if (!active) return
            setUser(data.user)
            return
          } catch {
            setAuthHeader(null)
          }
        }

        const refreshed = await api.post<{ accessToken: string }>('/auth/refresh')
        if (!active) return
        setAccessToken(refreshed.data.accessToken)
        setAuthHeader(refreshed.data.accessToken)
        const me = await api.get<{ user: User }>('/auth/me')
        if (!active) return
        setUser(me.data.user)
      } catch {
        if (!active) return
        setUser(null)
        setAccessToken(null)
        setAuthHeader(null)
      } finally {
        if (active) setReady(true)
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    if (accessToken) localStorage.setItem('accessToken', accessToken)
    else localStorage.removeItem('accessToken')
    setAuthHeader(accessToken)
  }, [accessToken, ready])

  const value = useMemo<AuthState>(
    () => ({
      ready,
      user,
      accessToken,
      async login(email, password) {
        const { data } = await api.post('/auth/login', { email, password })
        setUser(data.user)
        setAccessToken(data.accessToken)
      },
      async signup(name, email, password) {
        const { data } = await api.post('/auth/signup', { name, email, password })
        setUser(data.user)
        setAccessToken(data.accessToken)
      },
      async logout() {
        try {
          await api.post('/auth/logout')
        } finally {
          setUser(null)
          setAccessToken(null)
          setAuthHeader(null)
        }
      },
    }),
    [ready, user, accessToken],
  )

  return <AuthCtx.Provider value={value}>{props.children}</AuthCtx.Provider>
}

export function useAuth() {
  const v = useContext(AuthCtx)
  if (!v) throw new Error('AuthProvider missing')
  return v
}

export function RequireAuth(props: { children: React.ReactNode }) {
  const { ready, accessToken } = useAuth()
  const loc = useLocation()
  if (!ready) {
    return (
      <div className="grid min-h-full place-items-center px-4">
        <div className="w-full max-w-sm rounded-[28px] border border-white/60 bg-white/85 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-[var(--accent-soft)]" />
          <div className="mt-5 text-lg font-semibold text-slate-950">Preparing your workspace</div>
          <div className="mt-2 text-sm text-slate-600">Restoring your session and loading the latest project data.</div>
        </div>
      </div>
    )
  }
  if (!accessToken) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <>{props.children}</>
}
