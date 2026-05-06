import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeId = 'teal' | 'sky' | 'orange' | 'green' | 'violet'

type ThemeState = {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
}

const ThemeCtx = createContext<ThemeState | null>(null)

function applyTheme(t: ThemeId) {
  const root = document.documentElement
  root.setAttribute('data-theme', t)
}

export function ThemeProvider(props: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('teal')

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as ThemeId | null) ?? 'teal'
    setThemeState(saved)
    applyTheme(saved)
  }, [])

  const value = useMemo<ThemeState>(
    () => ({
      theme,
      setTheme(t) {
        setThemeState(t)
        localStorage.setItem('theme', t)
        applyTheme(t)
      },
    }),
    [theme],
  )

  return <ThemeCtx.Provider value={value}>{props.children}</ThemeCtx.Provider>
}

export function useTheme() {
  const v = useContext(ThemeCtx)
  if (!v) throw new Error('ThemeProvider missing')
  return v
}

