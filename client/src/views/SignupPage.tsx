import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroImage from '../assets/hero.png'
import { useAuth } from '../state/auth'
import { Button, ErrorBox, Input, Pill } from '../ui/components'
import { useToast } from '../ui/toast'

export function SignupPage() {
  const auth = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  return (
    <div className="min-h-full px-4 py-6 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/82 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
          <div className="grid h-full gap-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--accent-ink)]">Start strong</div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Create your account</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  Join the workspace and start creating projects, assigning work, and managing delivery with a more refined product experience.
                </p>
              </div>
              <Pill tone="teal">Modern UI</Pill>
            </div>

            {err ? <ErrorBox message={err} /> : null}

            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault()
                setSubmitting(true)
                setErr(null)
                try {
                  await auth.signup(name, email, password)
                  toast.success('Account created', 'Your workspace is ready to use.')
                  nav('/', { replace: true })
                } catch (error: any) {
                  setErr(error.message || 'Signup failed')
                  toast.error('Signup failed', error.message || 'Please try again')
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              <Input
                label="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="Ariana Admin"
              />
              <Input
                label="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@company.com"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                hint="At least 8 characters"
                placeholder="Create a secure password"
              />
              <Button type="submit" disabled={!name.trim() || !email.trim() || password.length < 8 || submitting}>
                {submitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Dashboards</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">Richer signals</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">Track completion, overdue work, and project momentum without digging.</div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Boards</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">Clear workflows</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">Manage priorities, assignees, and status changes in one polished board.</div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Roles</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">RBAC included</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">Admins and members get the right level of control from day one.</div>
              </div>
            </div>

            <div className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4">
                Sign in instead
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[36px] bg-slate-950 px-6 py-7 text-white shadow-[0_32px_100px_rgba(15,23,42,0.26)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_28%)]" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-white text-sm font-black text-slate-950">TF</div>
              <div>
                <div className="text-lg font-semibold">TaskFlow Studio</div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-300">Workspace preview</div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-4xl font-semibold tracking-tight text-white">Start with a polished foundation, not a bare starter.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                The project now includes a stronger dashboard, improved project settings, a task board with better controls, and a cleaner people-management experience.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Sample access</div>
                <div className="mt-3 text-lg font-semibold text-white">Admin + member demos</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  Seed the sample users to demo both sides of the role-based experience right away.
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Modern visuals</div>
                <div className="mt-3 text-lg font-semibold text-white">Cleaner product feel</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  Updated typography, softer depth, stronger hierarchy, and more intentional layout rhythms.
                </div>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-3 backdrop-blur">
              <img
                src={heroImage}
                alt="TaskFlow Studio product preview"
                className="h-[320px] w-full rounded-[24px] object-cover object-center"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
