import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { DashboardData } from '../lib/types'
import { describeDueDate, formatDateTime, getGreeting, statusLabel } from '../lib/format'
import { useAuth } from '../state/auth'
import { Button, Card, EmptyState, MetricCard, PageHeader, Pill, ProgressBar } from '../ui/components'

function StatusRow(props: { label: string; count: number; total: number; tone: 'teal' | 'amber' | 'violet' }) {
  const value = props.total ? Math.round((props.count / props.total) * 100) : 0
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-slate-700">{props.label}</div>
        <div className="text-sm font-semibold text-slate-950">{props.count}</div>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar value={value} />
        <Pill tone={props.tone}>{value}%</Pill>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const auth = useAuth()
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>('/dashboard')
      return data
    },
  })

  const data = dashboard.data
  const totalByStatus =
    (data?.myTasksByStatus.TODO ?? 0) +
    (data?.myTasksByStatus.IN_PROGRESS ?? 0) +
    (data?.myTasksByStatus.DONE ?? 0)

  return (
    <div className="page-split grid gap-6">
      <PageHeader
        kicker="Workspace overview"
        title={`${getGreeting()}, ${auth.user?.name?.split(' ')[0] ?? 'there'}`}
        description="This is your delivery pulse for today: what is moving, what needs intervention, and which projects are gaining momentum."
        actions={
          <>
            <Link
              to="/projects"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-2)]"
            >
              Open projects
            </Link>
            <Link
              to="/team"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Manage team
            </Link>
          </>
        }
      />

      <Card className="mesh-card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Pill tone="teal">Live workspace briefing</Pill>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Keep execution crisp without losing sight of the bigger portfolio.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Use the dashboard to spot overloaded projects, clear overdue work, and guide both admins and members through the week with confidence.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => window.scrollTo({ top: document.body.scrollHeight / 3, behavior: 'smooth' })}>
                Jump to priorities
              </Button>
              <Button variant="ghost" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                Review recent projects
              </Button>
            </div>
          </div>

          <div className="soft-grid rounded-[28px] border border-white/70 bg-white/70 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Today at a glance</div>
            <div className="mt-4 space-y-4">
              <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-300">Completion rate</div>
                <div className="mt-2 text-4xl font-semibold">{data?.summary.completionRate ?? 0}%</div>
                <div className="mt-2 text-sm text-slate-300">
                  {data?.summary.completedTasks ?? 0} of {data?.summary.tasksAssignedToMe ?? 0} tasks assigned to you are done.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Admin projects</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">{data?.summary.adminProjects ?? 0}</div>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Overdue</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">{data?.summary.overdueTasks ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
        <MetricCard
          label="Active projects"
          value={dashboard.isLoading ? '...' : data?.summary.totalProjects ?? 0}
          caption="Projects you currently belong to."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H11l1.8 2H17.5A2.5 2.5 0 0 1 20 9.5v8A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10Z" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          }
        />
        <MetricCard
          label="Assigned to you"
          value={dashboard.isLoading ? '...' : data?.summary.tasksAssignedToMe ?? 0}
          caption="Everything currently on your plate."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="m7 12 3 3 7-7M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          }
        />
        <MetricCard
          label="In progress"
          value={dashboard.isLoading ? '...' : data?.myTasksByStatus.IN_PROGRESS ?? 0}
          caption="Tasks actively moving right now."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 6v6l4 2m6-2a10 10 0 1 1-3.2-7.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />
        <MetricCard
          label="Completed"
          value={dashboard.isLoading ? '...' : data?.summary.completedTasks ?? 0}
          caption="Finished work assigned to you."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="m6 12 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 12A10 10 0 1 1 12 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card
          title="My workload"
          subtitle="How your current task queue is distributed."
          right={<Pill tone="slate">{totalByStatus} total</Pill>}
        >
          {dashboard.isLoading ? (
            <div className="text-sm text-slate-500">Loading workload metrics...</div>
          ) : (
            <div className="space-y-5">
              <StatusRow label="To do" count={data?.myTasksByStatus.TODO ?? 0} total={totalByStatus} tone="amber" />
              <StatusRow
                label="In progress"
                count={data?.myTasksByStatus.IN_PROGRESS ?? 0}
                total={totalByStatus}
                tone="teal"
              />
              <StatusRow label="Done" count={data?.myTasksByStatus.DONE ?? 0} total={totalByStatus} tone="violet" />
            </div>
          )}
        </Card>

        <Card title="Priority lane" subtitle="The most important work requiring attention today.">
          {dashboard.isLoading ? (
            <div className="text-sm text-slate-500">Loading priorities...</div>
          ) : !data?.overdue.length && !data?.upcoming.length ? (
            <EmptyState
              title="Everything is under control"
              message="You do not have any urgent or upcoming due dates right now. This is a great moment to plan your next project move."
            />
          ) : (
            <div className="space-y-4">
              {[...(data?.overdue ?? []), ...(data?.upcoming ?? [])].slice(0, 4).map((task) => (
                <div key={task._id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-950">{task.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{task.projectName}</div>
                    </div>
                    <Pill tone={data?.overdue.some((item) => item._id === task._id) ? 'red' : 'teal'}>
                      {data?.overdue.some((item) => item._id === task._id) ? 'Overdue' : statusLabel(task.status)}
                    </Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span>Priority: {task.priority}</span>
                    <span>|</span>
                    <span>{describeDueDate(task.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="Overdue tasks" subtitle="Anything here needs intervention or a due-date reset.">
          {dashboard.isLoading ? (
            <div className="text-sm text-slate-500">Loading overdue tasks...</div>
          ) : data?.overdue.length ? (
            <div className="space-y-3">
              {data.overdue.map((task) => (
                <Link
                  key={task._id}
                  to={`/projects/${task.projectId}`}
                  className="block rounded-[22px] border border-rose-100 bg-rose-50/70 p-4 transition hover:border-rose-200 hover:bg-rose-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{task.title}</div>
                      <div className="mt-1 text-xs text-rose-700">{task.projectName}</div>
                    </div>
                    <Pill tone="red">Overdue</Pill>
                  </div>
                  <div className="mt-3 text-xs text-slate-600">{formatDateTime(task.dueDate)}</div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No overdue tasks"
              message="Nothing assigned to you has slipped past its due date. Keep that momentum going."
            />
          )}
        </Card>

        <Card title="Upcoming due dates" subtitle="The next few tasks approaching a deadline.">
          {dashboard.isLoading ? (
            <div className="text-sm text-slate-500">Loading upcoming tasks...</div>
          ) : data?.upcoming.length ? (
            <div className="space-y-3">
              {data.upcoming.map((task) => (
                <Link
                  key={task._id}
                  to={`/projects/${task.projectId}`}
                  className="block rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 transition hover:border-[var(--accent-border)] hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{task.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{task.projectName}</div>
                    </div>
                    <Pill tone="teal">{statusLabel(task.status)}</Pill>
                  </div>
                  <div className="mt-3 text-xs text-slate-600">{describeDueDate(task.dueDate)}</div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming deadlines"
              message="You do not have any near-term due dates assigned at the moment."
            />
          )}
        </Card>
      </div>

      <Card title="Recent projects" subtitle="The workspaces with the latest movement and delivery activity.">
        {dashboard.isLoading ? (
          <div className="text-sm text-slate-500">Loading project summaries...</div>
        ) : data?.recentProjects.length ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(15.5rem,1fr))] gap-4">
            {data.recentProjects.map((project) => (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="block rounded-[26px] border border-slate-200 bg-slate-50/70 p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold text-slate-950">{project.name}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{project.description || 'No description yet.'}</div>
                  </div>
                  <Pill tone={project.myRole === 'ADMIN' ? 'violet' : 'slate'}>{project.myRole}</Pill>
                </div>
                <div className="mt-5 space-y-3">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>Completion</span>
                      <span>{project.completionRate ?? 0}%</span>
                    </div>
                    <ProgressBar value={project.completionRate ?? 0} />
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-3 text-center">
                    <div className="rounded-[18px] bg-white px-3 py-3">
                      <div className="text-[11px] font-medium leading-none text-slate-500">Tasks</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{project.taskCount ?? 0}</div>
                    </div>
                    <div className="rounded-[18px] bg-white px-3 py-3">
                      <div className="text-[11px] font-medium leading-none text-slate-500">Members</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{project.memberCount ?? 0}</div>
                    </div>
                    <div className="rounded-[18px] bg-white px-3 py-3">
                      <div className="text-[11px] font-medium leading-none text-slate-500">Overdue</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{project.overdueTaskCount ?? 0}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Next due: {project.nextDueDate ? formatDateTime(project.nextDueDate) : 'Nothing scheduled'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No projects yet"
            message="Create your first project to start tracking delivery, tasks, and team collaboration from a single workspace."
            action={
              <Link
                to="/projects"
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-2)]"
              >
                Create a project
              </Link>
            }
          />
        )}
      </Card>
    </div>
  )
}
