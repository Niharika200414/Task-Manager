import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { cx, describeDueDate, formatShortDate, priorityLabel, statusLabel, toDateTimeLocal } from '../lib/format'
import type { Member, Project, Role, Task, TaskPriority, TaskStatus } from '../lib/types'
import { useToast } from '../ui/toast'
import { useAuth } from '../state/auth'
import { AvatarBadge, Button, Card, EmptyState, ErrorBox, Input, PageHeader, Pill, ProgressBar, Select, Textarea } from '../ui/components'

type ProjectTab = 'board' | 'members' | 'settings'

type TaskDraft = {
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assignedTo: string
  dueDate: string
}

type ProjectDraft = {
  name: string
  description: string
}

const defaultProjectDraft: ProjectDraft = {
  name: '',
  description: '',
}

function createTaskDraft(currentUserId = ''): TaskDraft {
  return {
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    assignedTo: currentUserId,
    dueDate: '',
  }
}

function tabClasses(active: boolean) {
  return active ? 'primary' : 'ghost'
}

function priorityTone(priority: TaskPriority) {
  return priority === 'HIGH' ? 'red' : priority === 'MEDIUM' ? 'amber' : 'green'
}

function statusTone(status: TaskStatus) {
  return status === 'DONE' ? 'violet' : status === 'IN_PROGRESS' ? 'teal' : 'slate'
}

const compactFieldClassName =
  'min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]'

export function ProjectPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { projectId = '' } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const currentUserId = auth.user?.id ?? ''

  const [tab, setTab] = useState<ProjectTab>('board')
  const [err, setErr] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(() => createTaskDraft(currentUserId))
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(defaultProjectDraft)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [memberTab, setMemberTab] = useState<'ALL' | 'ADMINS' | 'MEMBERS'>('ALL')
  const [memberSearch, setMemberSearch] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('MEMBER')

  const project = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ project: Project }>(`/projects/${projectId}`)
      return data.project
    },
    enabled: !!projectId,
  })

  const members = useQuery({
    queryKey: ['members', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ members: Member[] }>(`/projects/${projectId}/members`)
      return data.members
    },
    enabled: !!projectId,
  })

  const tasks = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`)
      return data.tasks
    },
    enabled: !!projectId,
  })

  useEffect(() => {
    if (project.data) {
      setProjectDraft({
        name: project.data.name,
        description: project.data.description ?? '',
      })
    }
  }, [project.data?.name, project.data?.description])

  useEffect(() => {
    if (!editingTaskId) {
      setTaskDraft(createTaskDraft(currentUserId))
    }
  }, [currentUserId, editingTaskId])

  const isAdmin = project.data?.myRole === 'ADMIN'

  const memberOptions = useMemo(
    () => (members.data ?? []).map((member) => ({ id: member.user.id, label: member.user.name })),
    [members.data],
  )

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase()
    return (members.data ?? []).filter((member) => {
      if (memberTab === 'ADMINS' && member.role !== 'ADMIN') return false
      if (memberTab === 'MEMBERS' && member.role !== 'MEMBER') return false
      if (!query) return true
      return `${member.user.name} ${member.user.email}`.toLowerCase().includes(query)
    })
  }, [memberSearch, memberTab, members.data])

  const filteredTasks = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return (tasks.data ?? []).filter((task) => {
      if (onlyMine && task.assignedTo !== currentUserId) return false
      if (statusFilter && task.status !== statusFilter) return false
      if (priorityFilter && task.priority !== priorityFilter) return false
      if (!query) return true
      return `${task.title} ${task.description ?? ''} ${task.assignee?.name ?? ''} ${task.creator?.name ?? ''}`
        .toLowerCase()
        .includes(query)
    })
  }, [currentUserId, deferredSearch, onlyMine, priorityFilter, statusFilter, tasks.data])

  const taskSummary = useMemo(() => {
    const all = tasks.data ?? []
    const todoCount = all.filter((task) => task.status === 'TODO').length
    const inProgressCount = all.filter((task) => task.status === 'IN_PROGRESS').length
    const doneCount = all.filter((task) => task.status === 'DONE').length
    const overdueCount = all.filter((task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE').length
    return {
      totalCount: all.length,
      todoCount,
      inProgressCount,
      doneCount,
      overdueCount,
      completionRate: all.length ? Math.round((doneCount / all.length) * 100) : 0,
    }
  }, [tasks.data])

  const saveTask = useMutation({
    mutationFn: async () => {
      const basePayload = {
        title: taskDraft.title.trim(),
        description: taskDraft.description.trim() || undefined,
        priority: taskDraft.priority,
        status: taskDraft.status,
        dueDate: taskDraft.dueDate ? new Date(taskDraft.dueDate).toISOString() : undefined,
      }

      if (editingTaskId) {
        const payload = isAdmin
          ? { ...basePayload, assignedTo: taskDraft.assignedTo || undefined }
          : basePayload
        const { data } = await api.patch<{ task: Task }>(`/projects/${projectId}/tasks/${editingTaskId}`, payload)
        return data.task
      }

      const payload = {
        ...basePayload,
        assignedTo: isAdmin ? taskDraft.assignedTo || undefined : currentUserId || undefined,
      }
      const { data } = await api.post<{ task: Task }>(`/projects/${projectId}/tasks`, payload)
      return data.task
    },
    onSuccess: async () => {
      const updated = Boolean(editingTaskId)
      setEditingTaskId(null)
      setTaskDraft(createTaskDraft(currentUserId))
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
        qc.invalidateQueries({ queryKey: ['project', projectId] }),
        qc.invalidateQueries({ queryKey: ['projects'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      toast.success(updated ? 'Task updated' : 'Task created')
    },
    onError: (error: any) => {
      setErr(error.message || 'Failed to save the task')
      toast.error('Task save failed', error.message || 'Failed to save the task')
    },
  })

  const patchTask = useMutation({
    mutationFn: async (args: { taskId: string; patch: Partial<Task> }) => {
      await api.patch(`/projects/${projectId}/tasks/${args.taskId}`, args.patch)
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
        qc.invalidateQueries({ queryKey: ['project', projectId] }),
        qc.invalidateQueries({ queryKey: ['projects'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      toast.success('Task updated')
    },
    onError: (error: any) => {
      setErr(error.message || 'Failed to update the task')
      toast.error('Task update failed', error.message || 'Failed to update the task')
    },
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`)
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
        qc.invalidateQueries({ queryKey: ['project', projectId] }),
        qc.invalidateQueries({ queryKey: ['projects'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      toast.success('Task deleted')
    },
    onError: (error: any) => {
      setErr(error.message || 'Failed to delete the task')
      toast.error('Task delete failed', error.message || 'Failed to delete the task')
    },
  })

  const addMember = useMutation({
    mutationFn: async () => {
      await api.post(`/projects/${projectId}/members`, { email: inviteEmail.trim(), role: inviteRole })
    },
    onSuccess: async () => {
      setInviteEmail('')
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['members', projectId] }),
        qc.invalidateQueries({ queryKey: ['project', projectId] }),
        qc.invalidateQueries({ queryKey: ['projects'] }),
      ])
      toast.success('Member added')
    },
    onError: (error: any) => {
      setErr(error.message || 'Failed to add member')
      toast.error('Add member failed', error.message || 'Failed to add member')
    },
  })

  const updateMemberRole = useMutation({
    mutationFn: async (args: { userId: string; role: Role }) => {
      await api.patch(`/projects/${projectId}/members/${args.userId}`, { role: args.role })
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['members', projectId] }),
        qc.invalidateQueries({ queryKey: ['project', projectId] }),
        qc.invalidateQueries({ queryKey: ['projects'] }),
      ])
      toast.success('Role updated')
    },
    onError: (error: any) => {
      setErr(error.message || 'Failed to update role')
      toast.error('Role update failed', error.message || 'Failed to update role')
    },
  })

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/projects/${projectId}/members/${userId}`)
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['members', projectId] }),
        qc.invalidateQueries({ queryKey: ['project', projectId] }),
        qc.invalidateQueries({ queryKey: ['projects'] }),
      ])
      toast.success('Member removed')
    },
    onError: (error: any) => {
      setErr(error.message || 'Failed to remove member')
      toast.error('Remove member failed', error.message || 'Failed to remove member')
    },
  })

  const saveProject = useMutation({
    mutationFn: async () => {
      const payload = {
        name: projectDraft.name.trim(),
        description: projectDraft.description.trim() || undefined,
      }
      await api.patch(`/projects/${projectId}`, payload)
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['project', projectId] }),
        qc.invalidateQueries({ queryKey: ['projects'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      toast.success('Project updated')
    },
    onError: (error: any) => {
      setErr(error.message || 'Failed to update project')
      toast.error('Project update failed', error.message || 'Failed to update project')
    },
  })

  const deleteProject = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${projectId}`)
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['projects'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      toast.success('Project deleted')
      navigate('/projects')
    },
    onError: (error: any) => {
      setErr(error.message || 'Failed to delete project')
      toast.error('Project delete failed', error.message || 'Failed to delete project')
    },
  })

  function beginTaskEdit(task: Task) {
    setEditingTaskId(task._id)
    setTaskDraft({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo ?? currentUserId,
      dueDate: toDateTimeLocal(task.dueDate ?? null),
    })
    setTab('board')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetTaskComposer() {
    setEditingTaskId(null)
    setTaskDraft(createTaskDraft(currentUserId))
    setErr(null)
  }

  function canEditTask(task: Task) {
    return isAdmin || task.createdBy === currentUserId || task.assignedTo === currentUserId
  }

  function canDeleteTask(task: Task) {
    return isAdmin || task.createdBy === currentUserId
  }

  if (project.isLoading) {
    return <div className="text-sm text-slate-600">Loading project workspace...</div>
  }

  if (!project.data) {
    return <div className="text-sm text-slate-600">Project not found.</div>
  }

  const statusColumns: Array<{ status: TaskStatus; title: string; description: string }> = [
    { status: 'TODO', title: 'To do', description: 'Planned work that is ready to start.' },
    { status: 'IN_PROGRESS', title: 'In progress', description: 'Items actively being worked right now.' },
    { status: 'DONE', title: 'Done', description: 'Completed work and recent wins.' },
  ]

  return (
    <div className="page-split grid gap-6">
      <PageHeader
        kicker="Delivery workspace"
        title={project.data.name}
        description={project.data.description || 'A structured workspace for planning, assigning, and finishing project work.'}
        actions={
          <>
            <Pill tone={isAdmin ? 'violet' : 'slate'}>{project.data.myRole}</Pill>
            <Button variant="ghost" onClick={() => navigate('/projects')}>
              Back to projects
            </Button>
          </>
        }
      />

      <Card className="mesh-card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Pill tone="teal">Live project pulse</Pill>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              One place for planning, assignment, collaboration, and delivery control.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Admins can manage people, assignments, and settings. Members can stay focused on execution, progress updates, and the work they own.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/70 bg-white/80 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Completion</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{taskSummary.completionRate}%</div>
              </div>
              <div className="rounded-[22px] border border-white/70 bg-white/80 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Overdue</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{taskSummary.overdueCount}</div>
              </div>
              <div className="rounded-[22px] border border-white/70 bg-white/80 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Team</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{members.data?.length ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/70 bg-white/75 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Snapshot</div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Project progress</span>
                  <span>{taskSummary.completionRate}%</span>
                </div>
                <ProgressBar value={taskSummary.completionRate} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Tasks</div>
                  <div className="mt-2 text-xl font-semibold text-slate-950">{taskSummary.totalCount}</div>
                </div>
                <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">High priority</div>
                  <div className="mt-2 text-xl font-semibold text-slate-950">{project.data.highPriorityTaskCount ?? 0}</div>
                </div>
                <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Admins</div>
                  <div className="mt-2 text-xl font-semibold text-slate-950">{project.data.adminCount ?? 0}</div>
                </div>
                <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Updated</div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">{formatShortDate(project.data.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant={tabClasses(tab === 'board')} onClick={() => setTab('board')}>
          Board
        </Button>
        <Button variant={tabClasses(tab === 'members')} onClick={() => setTab('members')}>
          Members
        </Button>
        <Button variant={tabClasses(tab === 'settings')} onClick={() => setTab('settings')}>
          Settings
        </Button>
      </div>

      {err ? <ErrorBox message={err} /> : null}

      {tab === 'board' ? (
        <div className="grid gap-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
            <Card>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">To do</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">{taskSummary.todoCount}</div>
              <div className="mt-2 text-sm text-slate-600">Planned work waiting to move.</div>
            </Card>
            <Card>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">In progress</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">{taskSummary.inProgressCount}</div>
              <div className="mt-2 text-sm text-slate-600">Active tasks currently in flight.</div>
            </Card>
            <Card>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Done</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">{taskSummary.doneCount}</div>
              <div className="mt-2 text-sm text-slate-600">Completed tasks delivering value already.</div>
            </Card>
            <Card>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Filtered view</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">{filteredTasks.length}</div>
              <div className="mt-2 text-sm text-slate-600">Tasks matching your current board filters.</div>
            </Card>
          </div>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <Card
              title={editingTaskId ? 'Edit task details' : isAdmin ? 'Create and assign work' : 'Create a task'}
              subtitle={editingTaskId ? 'Update titles, due dates, descriptions, and workflow settings.' : 'Capture the next piece of work and send it into the board with a clear owner and deadline.'}
              className="mesh-card"
            >
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  setErr(null)
                  saveTask.mutate()
                }}
              >
                <Input
                  label="Title"
                  placeholder="Polish onboarding handoff"
                  value={taskDraft.title}
                  onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))}
                />
                <Textarea
                  label="Description"
                  rows={4}
                  placeholder="Add context so the next person knows exactly what good looks like."
                  value={taskDraft.description}
                  onChange={(event) => setTaskDraft((current) => ({ ...current, description: event.target.value }))}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    label="Priority"
                    value={taskDraft.priority}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>
                  <Select
                    label="Status"
                    value={taskDraft.status}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, status: event.target.value as TaskStatus }))}
                  >
                    <option value="TODO">To do</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="DONE">Done</option>
                  </Select>
                  <Input
                    label="Due date"
                    type="datetime-local"
                    value={taskDraft.dueDate}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  />
                  <Select
                    label="Assignee"
                    value={isAdmin ? taskDraft.assignedTo : currentUserId}
                    disabled={!isAdmin}
                    hint={isAdmin ? 'Optional' : 'Members create tasks for themselves'}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, assignedTo: event.target.value }))}
                  >
                    {isAdmin ? <option value="">Unassigned</option> : null}
                    {memberOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={!taskDraft.title.trim() || saveTask.isPending}>
                    {editingTaskId ? 'Save task changes' : 'Create task'}
                  </Button>
                  {editingTaskId ? (
                    <Button type="button" variant="ghost" onClick={resetTaskComposer}>
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </form>
            </Card>

            <Card title="Board filters" subtitle="Focus the board by owner, status, priority, or text search.">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(12.5rem,1fr))] gap-4">
                <Input
                  label="Search"
                  placeholder="Search tasks or people"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">All statuses</option>
                  <option value="TODO">To do</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="DONE">Done</option>
                </Select>
                <Select label="Priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                  <option value="">All priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </Select>
                <div className="flex items-end">
                  <button
                    type="button"
                    className={cx(
                      'w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                      onlyMine
                        ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                    onClick={() => setOnlyMine((current) => !current)}
                  >
                    {onlyMine ? 'Showing only my tasks' : 'Show only my tasks'}
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {statusColumns.map((column) => {
              const columnTasks = filteredTasks.filter((task) => task.status === column.status)
              return (
                <Card
                  key={column.status}
                  title={column.title}
                  subtitle={column.description}
                  right={<Pill tone={statusTone(column.status)}>{columnTasks.length}</Pill>}
                  className="h-full"
                >
                  {tasks.isLoading ? (
                    <div className="text-sm text-slate-500">Loading tasks...</div>
                  ) : columnTasks.length ? (
                    <div className="space-y-4">
                      {columnTasks.map((task) => (
                        <div key={task._id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-950">{task.title}</div>
                              {task.description ? <div className="mt-2 text-sm leading-6 text-slate-600">{task.description}</div> : null}
                            </div>
                            <Pill tone={priorityTone(task.priority)}>{priorityLabel(task.priority)}</Pill>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Pill tone={statusTone(task.status)}>{statusLabel(task.status)}</Pill>
                            {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? (
                              <Pill tone="red">Overdue</Pill>
                            ) : null}
                          </div>

                          <div className="mt-4 space-y-3 rounded-[20px] bg-white px-4 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Assignee</div>
                              <div className="min-w-0 break-words text-sm font-medium text-slate-700">
                                {task.assignee ? task.assignee.name : 'Unassigned'}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Due</div>
                              <div className="min-w-0 break-words text-sm font-medium text-slate-700">{describeDueDate(task.dueDate)}</div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Created by</div>
                              <div className="min-w-0 break-words text-sm font-medium text-slate-700">{task.creator?.name ?? 'Unknown'}</div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3">
                            {canEditTask(task) ? (
                              <>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <select
                                    className={compactFieldClassName}
                                    value={task.status}
                                    onChange={(event) => patchTask.mutate({ taskId: task._id, patch: { status: event.target.value as TaskStatus } })}
                                  >
                                    <option value="TODO">To do</option>
                                    <option value="IN_PROGRESS">In progress</option>
                                    <option value="DONE">Done</option>
                                  </select>
                                  <select
                                    className={compactFieldClassName}
                                    value={task.priority}
                                    onChange={(event) => patchTask.mutate({ taskId: task._id, patch: { priority: event.target.value as TaskPriority } })}
                                  >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                  </select>
                                </div>
                                {isAdmin ? (
                                  <select
                                    className={compactFieldClassName}
                                    value={task.assignedTo ?? ''}
                                    onChange={(event) =>
                                      patchTask.mutate({
                                        taskId: task._id,
                                        patch: { assignedTo: event.target.value || undefined },
                                      })
                                    }
                                  >
                                    <option value="">Unassigned</option>
                                    {memberOptions.map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : null}
                              </>
                            ) : null}

                            <div className="flex flex-wrap gap-3">
                              {canEditTask(task) ? (
                                <Button type="button" variant="ghost" onClick={() => beginTaskEdit(task)}>
                                  Edit details
                                </Button>
                              ) : null}
                              {canDeleteTask(task) ? (
                                <Button
                                  type="button"
                                  variant="danger"
                                  onClick={() => {
                                    if (window.confirm(`Delete "${task.title}"?`)) {
                                      deleteTask.mutate(task._id)
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No tasks here" message="Nothing in this column matches the current filters yet." />
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ) : null}

      {tab === 'members' ? (
        <div className="grid gap-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
            <Card>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Members</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">{members.data?.length ?? 0}</div>
            </Card>
            <Card>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admins</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {(members.data ?? []).filter((member) => member.role === 'ADMIN').length}
              </div>
            </Card>
            <Card>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Contributors</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">
                {(members.data ?? []).filter((member) => member.role === 'MEMBER').length}
              </div>
            </Card>
            <Card>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Visible now</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">{filteredMembers.length}</div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <Card title="Project members" subtitle="Search the roster, manage roles, and remove people when needed.">
              <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                <Input
                  label="Search people"
                  placeholder="Search by name or email"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                />
                <div className="flex items-end">
                  <Button variant={memberTab === 'ALL' ? 'secondary' : 'ghost'} onClick={() => setMemberTab('ALL')} className="w-full">
                    All
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button variant={memberTab === 'ADMINS' ? 'secondary' : 'ghost'} onClick={() => setMemberTab('ADMINS')} className="w-full">
                    Admins
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button variant={memberTab === 'MEMBERS' ? 'secondary' : 'ghost'} onClick={() => setMemberTab('MEMBERS')} className="w-full">
                    Members
                  </Button>
                </div>
              </div>

              {members.isLoading ? (
                <div className="text-sm text-slate-500">Loading member roster...</div>
              ) : filteredMembers.length ? (
                <div className="space-y-3">
                  {filteredMembers.map((member) => {
                    const cannotEdit = member.user.id === project.data?.createdBy || member.user.id === currentUserId
                    return (
                      <div key={member.user.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <AvatarBadge
                            name={member.user.name}
                            subtitle={`${member.user.email} | Joined ${formatShortDate(member.joinedAt)}`}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill tone={member.role === 'ADMIN' ? 'violet' : 'slate'}>{member.role}</Pill>
                            <Pill tone="green">Active</Pill>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {isAdmin ? (
                            <>
                              <select
                                className={compactFieldClassName}
                                value={member.role}
                                disabled={cannotEdit}
                                onChange={(event) =>
                                  updateMemberRole.mutate({
                                    userId: member.user.id,
                                    role: event.target.value as Role,
                                  })
                                }
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                              </select>
                              {!cannotEdit ? (
                                <Button
                                  type="button"
                                  variant="danger"
                                  onClick={() => {
                                    if (window.confirm(`Remove ${member.user.name} from this project?`)) {
                                      removeMember.mutate(member.user.id)
                                    }
                                  }}
                                >
                                  Remove
                                </Button>
                              ) : null}
                            </>
                          ) : (
                            <div className="text-sm text-slate-500">Admins manage membership controls for this project.</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState title="No members match" message="Try changing the filters or search phrase to find the person you need." />
              )}
            </Card>

            {isAdmin ? (
              <Card title="Add member" subtitle="Add an existing user by email and choose the right project role.">
                <form
                  className="grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setErr(null)
                    addMember.mutate()
                  }}
                >
                  <Input
                    label="Member email"
                    placeholder="member@company.com"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                  />
                  <Select
                    label="Role"
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value as Role)}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                  <Button type="submit" disabled={!inviteEmail.trim() || addMember.isPending}>
                    Add to project
                  </Button>
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
                    This uses existing accounts by email, which works nicely with the included demo admin and member users.
                  </div>
                </form>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === 'settings' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <Card title="Project settings" subtitle="Refine the project identity and keep the workspace description accurate.">
            {isAdmin ? (
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
                  value={projectDraft.name}
                  onChange={(event) => setProjectDraft((current) => ({ ...current, name: event.target.value }))}
                />
                <Textarea
                  label="Description"
                  rows={6}
                  value={projectDraft.description}
                  onChange={(event) => setProjectDraft((current) => ({ ...current, description: event.target.value }))}
                />
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={!projectDraft.name.trim() || saveProject.isPending}>
                    Save project changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setProjectDraft({
                        name: project.data?.name ?? '',
                        description: project.data?.description ?? '',
                      })
                    }
                  >
                    Reset
                  </Button>
                </div>
              </form>
            ) : (
              <EmptyState
                title="Settings are admin-only"
                message="You can still update the work you own on the board, but project identity and dangerous actions are reserved for admins."
              />
            )}
          </Card>

          <Card title="Danger zone" subtitle="Use this carefully. Deleting a project removes its tasks and memberships too.">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-rose-200 bg-rose-50/70 px-4 py-4 text-sm leading-6 text-rose-800">
                Project deletion is permanent for this workspace and affects the full team.
              </div>
              <div className="text-sm text-slate-600">
                Only admins can perform this action. Make sure the team no longer needs the project history before continuing.
              </div>
              <Button
                variant="danger"
                disabled={!isAdmin || deleteProject.isPending}
                onClick={() => {
                  if (window.confirm(`Delete "${project.data?.name}" and all of its tasks?`)) {
                    deleteProject.mutate()
                  }
                }}
              >
                Delete project
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
