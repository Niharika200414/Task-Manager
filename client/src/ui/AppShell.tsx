import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth'
import { useTheme, type ThemeId } from '../state/theme'
import { Button, Pill } from './components'
import { cx } from '../lib/format'

const navigation = [
  {
    to: '/',
    label: 'Dashboard',
    blurb: 'Live delivery pulse, focus lists, and project momentum.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 12.5 11 4v6h9v10h-7v-6H4v-1.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/projects',
    label: 'Projects',
    blurb: 'Shape initiatives, see progress, and manage delivery plans.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H11l1.8 2H17.5A2.5 2.5 0 0 1 20 9.5v8A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/team',
    label: 'Team',
    blurb: 'Manage people, roles, and collaboration by workspace.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M7.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 1.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 20a4 4 0 0 1 8 0m2 0a4.5 4.5 0 0 1 8-2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
]

const pageCopy = [
  {
    match: (pathname: string) => pathname === '/',
    eyebrow: 'Mission control',
    title: 'Workspace dashboard',
    description: 'Track delivery health, overdue work, and the next things your team should move.',
  },
  {
    match: (pathname: string) => pathname.startsWith('/projects/'),
    eyebrow: 'Delivery workspace',
    title: 'Project board',
    description: 'Manage the project plan, task pipeline, team roster, and settings in one place.',
  },
  {
    match: (pathname: string) => pathname.startsWith('/projects'),
    eyebrow: 'Portfolio',
    title: 'Projects library',
    description: 'Create, edit, and monitor every workspace with richer progress and team signals.',
  },
  {
    match: (pathname: string) => pathname.startsWith('/team'),
    eyebrow: 'People ops',
    title: 'Team management',
    description: 'See who is involved, adjust access, and keep collaboration balanced across projects.',
  },
]

function navClasses(active: boolean) {
  return cx(
    'group block rounded-[24px] border px-4 py-3 transition duration-200',
    active
      ? 'border-[var(--accent-border)] bg-white text-slate-950 shadow-[0_20px_40px_rgba(15,23,42,0.08)]'
      : 'border-transparent bg-transparent text-slate-600 hover:border-white/70 hover:bg-white/70 hover:text-slate-900',
  )
}

function SidebarIcon(props: { children: React.ReactNode; active: boolean }) {
  return (
    <span
      className={cx(
        'grid h-11 w-11 place-items-center rounded-2xl transition',
        props.active ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200',
      )}
    >
      {props.children}
    </span>
  )
}

function ThemeSwatch(props: { id: ThemeId; className: string; onPick: (id: ThemeId) => void; active: boolean }) {
  return (
    <button
      type="button"
      className={[
        'h-8 w-10 rounded-xl border shadow-sm transition',
        props.className,
        props.active ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-white' : 'hover:-translate-y-0.5 hover:opacity-90',
      ].join(' ')}
      onClick={() => props.onPick(props.id)}
      aria-label={`theme-${props.id}`}
      title={props.id}
    />
  )
}

export function AppShell() {
  const auth = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const activePage = pageCopy.find((item) => item.match(location.pathname)) ?? pageCopy[0]

  return (
    <div className="min-h-full text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-4%] h-72 w-72 rounded-full bg-[var(--orb-a)] blur-3xl" />
        <div className="absolute right-[-5%] top-[18%] h-80 w-80 rounded-full bg-[var(--orb-b)] blur-3xl" />
        <div className="absolute bottom-[-8%] left-[35%] h-72 w-72 rounded-full bg-[var(--orb-c)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-slate-950 text-sm font-black text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
              TF
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-slate-950">TaskFlow Studio</div>
              <div className="hidden truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 sm:block">
                Modern team operations
              </div>
            </div>
          </Link>

          <div className="hidden flex-1 px-4 xl:block">
            <div className="mx-auto max-w-xl rounded-[24px] border border-white/70 bg-white/75 px-5 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-ink)]">
                {activePage.eyebrow}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-950">{activePage.title}</div>
              <div className="mt-1 text-xs text-slate-500">{activePage.description}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <div className="hidden flex-wrap gap-2 lg:flex">
              <ThemeSwatch id="teal" className="bg-[#0f766e]" onPick={theme.setTheme} active={theme.theme === 'teal'} />
              <ThemeSwatch id="sky" className="bg-[#2563eb]" onPick={theme.setTheme} active={theme.theme === 'sky'} />
              <ThemeSwatch id="orange" className="bg-[#ea580c]" onPick={theme.setTheme} active={theme.theme === 'orange'} />
              <ThemeSwatch id="green" className="bg-[#15803d]" onPick={theme.setTheme} active={theme.theme === 'green'} />
              <ThemeSwatch id="violet" className="bg-[#7c3aed]" onPick={theme.setTheme} active={theme.theme === 'violet'} />
            </div>

            <div className="hidden rounded-[24px] border border-white/70 bg-white/80 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:block">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Signed in</div>
              <div className="mt-1 text-sm font-semibold text-slate-950">{auth.user?.name ?? 'Workspace user'}</div>
              <div className="text-xs text-slate-500">{auth.user?.email ?? 'No email loaded'}</div>
            </div>

            <Button
              variant="ghost"
              onClick={async () => {
                await auth.logout()
                nav('/login')
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[285px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-[32px] border border-white/70 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
              <Pill tone="teal" className="border-white/10 bg-white/10 text-white">
                Demo-ready workspace
              </Pill>
              <div className="mt-4 text-xl font-semibold tracking-tight">Plan work, align people, and ship with clarity.</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">
                Everything in this workspace is organized to help admins steer and members execute without friction.
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="secondary" className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => nav('/projects')}>
                  Open projects
                </Button>
                <Button variant="ghost" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => nav('/team')}>
                  View team
                </Button>
              </div>
            </div>

            <nav className="mt-4 grid gap-2">
              {navigation.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => navClasses(isActive)}>
                  {({ isActive }) => (
                    <div className="flex items-start gap-3">
                      <SidebarIcon active={isActive}>{item.icon}</SidebarIcon>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className={cx('mt-1 text-xs leading-5', isActive ? 'text-slate-600' : 'text-slate-500')}>{item.blurb}</div>
                      </div>
                    </div>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Active identity</div>
              <div className="mt-2 text-sm font-semibold text-slate-950">{auth.user?.name ?? 'Workspace user'}</div>
              <div className="truncate text-xs text-slate-500">{auth.user?.email ?? ''}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <ThemeSwatch id="teal" className="bg-[#0f766e]" onPick={theme.setTheme} active={theme.theme === 'teal'} />
                <ThemeSwatch id="sky" className="bg-[#2563eb]" onPick={theme.setTheme} active={theme.theme === 'sky'} />
                <ThemeSwatch id="orange" className="bg-[#ea580c]" onPick={theme.setTheme} active={theme.theme === 'orange'} />
                <ThemeSwatch id="green" className="bg-[#15803d]" onPick={theme.setTheme} active={theme.theme === 'green'} />
                <ThemeSwatch id="violet" className="bg-[#7c3aed]" onPick={theme.setTheme} active={theme.theme === 'violet'} />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
