import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { percentage } from '../lib/format'
import type { Project } from '../lib/types'
import { Button, Card, EmptyState, ErrorBox, Input, PageHeader, Pill, ProgressBar, Textarea } from '../ui/components'
import { useToast } from '../ui/toast'

type ProjectForm = {
  name: string
  description: string
}

const emptyForm: ProjectForm = {
  name: '',
  description: '',
}

export function ProjectsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [form, setForm] = useState<ProjectForm>(emptyForm)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<{ projects: Project[] }>('/projects')
      return data.projects
    },
  })

  const portfolio = useMemo(() => {
    const items = projects.data ?? []
    const totalTasks = items.reduce((sum, project) => sum + (project.taskCount ?? 0), 0)
    const completedTasks = items.reduce((sum, project) => sum + (project.completedTaskCount ?? 0), 0)
    return {
      totalProjects: items.length,
      adminProjects: items.filter((project) => project.myRole === 'ADMIN').length,
      memberProjects: items.filter((project) => project.myRole === 'MEMBER').length,
      totalTasks,
      completionRate: percentage(completedTasks, totalTasks),
    }
  }, [projects.data])

  const saveProject = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      }

      if (editingProjectId) {
        const { data } = await api.patch<{ project: Project }>(`/projects/${editingProjectId}`, payload)
        return data.project
      }

      const { data } = await api.post<{ project: Project }>('/projects', payload)
      return data.project
    },
    onSuccess: async () => {
      const wasEditing = Boolean(editingProjectId)
      setForm(emptyForm)
      setEditingProjectId(null)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['projects'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      toast.success(wasEditing ? 'Project updated' : 'Project created')
    },
    onError: (error: any) => {
      setErr(error.message || 'Unable to save the project')
      toast.error('Save failed', error.message || 'Unable to save the project')
    },
  })

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      await api.delete(`/projects/${projectId}`)
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['projects'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      toast.success('Project deleted')
    },
    onError: (error: any) => {
      setErr(error.message || 'Unable to delete the project')
      toast.error('Delete failed', error.message || 'Unable to delete the project')
    },
  })

  function resetForm() {
    setEditingProjectId(null)
    setForm(emptyForm)
    setErr(null)
  }

  function beginEdit(project: Project) {
    setEditingProjectId(project._id)
    setForm({
      name: project.name,
      description: project.description ?? '',
    })
    setErr(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page-split grid gap-6">
      <PageHeader
        kicker="Portfolio"
        title="Create polished project spaces for your team"
        description="This is the hub for spinning up workspaces, reviewing delivery health, and jumping into the projects that need attention."
        actions={
          <Button onClick={() => window.scrollTo({ top: document.body.scrollHeight / 4, behavior: 'smooth' })}>
            Jump to portfolio
          </Button>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
        <Card>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Projects</div>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{projects.isLoading ? '...' : portfolio.totalProjects}</div>
          <div className="mt-2 text-sm text-slate-600">All projects in your portfolio right now.</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admin access</div>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{projects.isLoading ? '...' : portfolio.adminProjects}</div>
          <div className="mt-2 text-sm text-slate-600">Projects where you can manage people and settings.</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Member access</div>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{projects.isLoading ? '...' : portfolio.memberProjects}</div>
          <div className="mt-2 text-sm text-slate-600">Projects where you contribute without admin control.</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Completion trend</div>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{projects.isLoading ? '...' : `${portfolio.completionRate}%`}</div>
          <div className="mt-3">
            <ProgressBar value={portfolio.completionRate} />
          </div>
          <div className="mt-2 text-sm text-slate-600">Blended completion across all visible project tasks.</div>
        </Card>
      </div>

      {err ? <ErrorBox message={err} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,20rem)_minmax(0,1fr)]">        <Card
          title={editingProjectId ? 'Update project' : 'Launch a new project'}
          subtitle="Set the name, define the purpose, and give your team a clean place to work."
          className="mesh-card"
        >
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              setErr(null)
              saveProject.mutate()
            }}
          >
            <Input
              label="Project name"
              placeholder="Northstar product launch"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Textarea
              label="Description"
              rows={5}
              placeholder="What is this project for and how should the team use it?"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!form.name.trim() || saveProject.isPending}>
                {editingProjectId ? 'Save changes' : 'Create project'}
              </Button>
              {editingProjectId ? (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-600">
              Admins can rename and delete projects later from both this page and the project settings view.
            </div>
          </form>
        </Card>

        <Card title="Project portfolio" subtitle="Every project now includes richer progress, team, and urgency signals.">
          {projects.isLoading ? (
            <div className="text-sm text-slate-500">Loading your portfolio...</div>
          ) : projects.data?.length ? (
            <div className="grid grid-cols-1 gap-5">              {projects.data.map((project) => {
                const isAdmin = project.myRole === 'ADMIN'
                return (
                  <div
  key={project._id}
  className="flex h-full min-w-0 overflow-hidden flex-col rounded-[26px] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:bg-white"
>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start gap-2">
                        <div className="project-card-clamp project-card-title text-lg font-semibold leading-tight text-slate-950">
                          {project.name}
                        </div>
                        <Pill
  tone={isAdmin ? 'violet' : 'slate'}
  className="max-w-full self-start whitespace-nowrap px-2 py-0.5 text-[11px]"
>
                          {isAdmin ? 'Admin' : 'Member'}
                        </Pill>
                      </div>
                      <div className="project-card-clamp project-card-description mt-2 text-sm leading-6 text-slate-600">
                        {project.description || 'No description yet.'}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Completion</span>
                        <span>{project.completionRate ?? 0}%</span>
                      </div>
                      <ProgressBar value={project.completionRate ?? 0} />
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-[18px] bg-white px-2 py-2">
                      <div className="min-w-0 text-center">
                        <div className="truncate text-[10px] font-medium leading-tight text-slate-500">Task</div>
                        <div className="mt-1 text-xl font-semibold leading-none text-slate-950">{project.taskCount ?? 0}</div>
                      </div>
                      <div className="min-w-0 text-center">
                        <div className="truncate text-[10px] font-medium leading-tight text-slate-500">Member</div>
                        <div className="mt-1 text-xl font-semibold leading-none text-slate-950">{project.memberCount ?? 0}</div>
                      </div>
                      <div className="min-w-0 text-center">
                        <div className="truncate text-[10px] font-medium leading-tight text-slate-500">Admin</div>
                        <div className="mt-1 text-xl font-semibold leading-none text-slate-950">{project.adminCount ?? 0}</div>
                      </div>
                      <div className="min-w-0 text-center">
                        <div className="truncate text-[10px] font-medium leading-tight text-slate-500">Overdue</div>
                        <div className="mt-1 text-xl font-semibold leading-none text-slate-950">{project.overdueTaskCount ?? 0}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      High priority tasks: <span className="font-semibold text-slate-700">{project.highPriorityTaskCount ?? 0}</span>
                    </div>

                    <div className="mt-auto pt-4 overflow-hidden">
                     <Link
  to={`/projects/${project._id}`}
  className="inline-flex w-full items-center justify-center text-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-2)]"
>
                        Open project
                      </Link>
                      {isAdmin ? (
                        <div className="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">                          <Button type="button" variant="ghost" onClick={() => beginEdit(project)}>
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => {
                              if (window.confirm(`Delete "${project.name}"? This removes tasks and memberships too.`)) {
                                deleteProject.mutate(project._id)
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="No projects yet"
              message="Create your first workspace here, then use the project board to assign tasks, manage members, and track delivery with a cleaner modern interface."
            />
          )}
        </Card>
      </div>
    </div>
  )
}
