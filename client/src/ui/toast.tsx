import React, { createContext, useContext, useMemo, useRef, useState } from 'react'

type ToastTone = 'success' | 'error' | 'info'
type Toast = { id: string; title: string; message?: string; tone: ToastTone }

type ToastApi = {
  show: (t: Omit<Toast, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastCtx = createContext<ToastApi | null>(null)

function toneClasses(t: ToastTone) {
  if (t === 'success') return 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
  if (t === 'error') return 'border-rose-200 bg-rose-50/95 text-rose-900'
  return 'border-sky-200 bg-sky-50/95 text-sky-900'
}

export function ToastProvider(props: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, any>())

  const api = useMemo<ToastApi>(() => {
    function show(t: Omit<Toast, 'id'>) {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`
      const toast: Toast = { id, ...t }
      setToasts((prev) => [toast, ...prev].slice(0, 5))
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
        timers.current.delete(id)
      }, 2800)
      timers.current.set(id, timer)
    }
    return {
      show,
      success: (title, message) => show({ tone: 'success', title, message }),
      error: (title, message) => show({ tone: 'error', title, message }),
      info: (title, message) => show({ tone: 'info', title, message }),
    }
  }, [])

  return (
    <ToastCtx.Provider value={api}>
      {props.children}
      <div className="fixed bottom-4 left-4 right-4 z-50 grid justify-items-end gap-2 sm:left-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'w-[min(20rem,calc(100vw-2rem))] rounded-2xl border p-3 shadow-[0_12px_24px_rgba(15,23,42,0.12)] backdrop-blur',
              'animate-[toast-in_160ms_ease-out]',
              toneClasses(t.tone),
            ].join(' ')}
          >
            <div className="text-sm font-semibold">{t.title}</div>
            {t.message ? <div className="mt-0.5 text-xs opacity-80">{t.message}</div> : null}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { transform: translateY(-6px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const v = useContext(ToastCtx)
  if (!v) throw new Error('ToastProvider missing')
  return v
}

