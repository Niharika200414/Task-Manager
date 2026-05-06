import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import heroImage from '../assets/hero.png'
import { useAuth } from '../state/auth'
import { Button, ErrorBox, Input, Pill } from '../ui/components'
import { useToast } from '../ui/toast'

const demoAccounts = [
  {
    label: 'Admin demo',
    email: 'admin@taskflowpro.demo',
    password: 'DemoPass123!',
    note: 'Full admin access, project controls, and role management.',
  },
  {
    label: 'Member demo',
    email: 'member@taskflowpro.demo',
    password: 'DemoPass123!',
    note: 'Member-level experience focused on execution and task updates.',
  },
]

export function LoginPage() {
  const auth = useAuth()
  const nav = useNavigate()
  const loc = useLocation() as any
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function performLogin(nextEmail: string, nextPassword: string) {
    setSubmitting(true)
    setErr(null)
    try {
      await auth.login(nextEmail, nextPassword)
      toast.success('Signed in', 'Your workspace is ready.')
      nav(loc.state?.from ?? '/', { replace: true })
    } catch (error: any) {
      setErr(error.message || 'Login failed')
      toast.error('Login failed', error.message || 'Check your credentials and try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full px-4 py-6 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden rounded-[36px] bg-slate-950 px-6 py-7 text-white shadow-[0_32px_100px_rgba(15,23,42,0.26)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_28%)]" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-white text-sm font-black text-slate-950">TF</div>
                <div>
                  <div className="text-lg font-semibold">TaskFlow Studio</div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-300">Modern team operations</div>
                </div>
              </div>
              <Pill tone="teal" className="border-white/10 bg-white/10 text-white">
                Demo-ready
              </Pill>
            </div>

            <div className="mt-8 max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                A more beautiful place to run projects, people, and priorities.
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Sign in to a polished team workspace with a cleaner dashboard, richer project boards, modern member management, and sample admin/member flows built in.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Portfolio</div>
                <div className="mt-3 text-2xl font-semibold text-white">Projects</div>
                <div className="mt-2 text-sm text-slate-300">Create, update, and monitor workspaces with delivery metrics baked in.</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Execution</div>
                <div className="mt-3 text-2xl font-semibold text-white">Tasks</div>
                <div className="mt-2 text-sm text-slate-300">Board-driven workflow with clear ownership, filters, and quick updates.</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-300">People</div>
                <div className="mt-3 text-2xl font-semibold text-white">Roles</div>
                <div className="mt-2 text-sm text-slate-300">Role-based access for admins and members across every workspace.</div>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-3 backdrop-blur">
              <img
                src={heroImage}
                alt="TaskFlow Studio dashboard preview"
                className="h-[280px] w-full rounded-[24px] object-cover object-center"
              />
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[36px] border border-white/70 bg-white/82 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--accent-ink)]">Welcome back</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Sign in to your workspace</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use your own account or jump straight in with one of the sample demo accounts below.
              </p>
            </div>

            {err ? <div className="mt-5"><ErrorBox message={err} /></div> : null}

            <form
              className="mt-6 grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault()
                await performLogin(email, password)
              }}
            >
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
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              <Button type="submit" disabled={!email.trim() || !password || submitting}>
                {submitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-8">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quick demo access</div>
              <div className="mt-4 grid gap-3">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-left transition hover:border-[var(--accent-border)] hover:bg-white"
                    onClick={async () => {
                      setEmail(account.email)
                      setPassword(account.password)
                      await performLogin(account.email, account.password)
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-950">{account.label}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {account.email} / {account.password}
                        </div>
                      </div>
                      <Pill tone="teal">Use now</Pill>
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-600">{account.note}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 text-sm text-slate-600">
              Need a new account?{' '}
              <Link to="/signup" className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4">
                Create one here
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
