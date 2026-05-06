import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatShortDate } from '../lib/format'
import type { Member, Project, Role } from '../lib/types'
import { useToast } from '../ui/toast'
import { useAuth } from '../state/auth'
import { AvatarBadge, Button, Card, EmptyState, ErrorBox, Input, PageHeader, Pill, Select } from '../ui/components'

const compactFieldClassName =
  'min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]'

export function TeamPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const auth = useAuth()
  const [err, setErr] = useState<string | null>(null)
  const [projectId, setProjectId] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [memberTab, setMemberTab] = useState<'ALL' | 'ADMINS' | 'MEMBERS'>('ALL')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('MEMBER')

  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<{ projects: Project[] }>('/projects')
      return data.projects
    },
  })

  useEffect(() => {
    if (!projectId && projects.data?.length) {
      setProjectId(projects.data[0]._id)
    }
  }, [projectId, projects.data])

  const selectedProject = useMemo(
    () => projects.data?.find((project) => project._id === projectId),
    [projectId, projects.data],
  )
  const isAdmin = selectedProject?.myRole === 'ADMIN'

  const members = useQuery({
    queryKey: ['members', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ members: Member[] }>(`/projects/${projectId}/members`)
      return data.members
    },
    enabled: !!projectId,
  })

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase()
    return (members.data ?? []).filter((member) => {
      if (memberTab === 'ADMINS' && member.role !== 'ADMIN') return false
      if (memberTab === 'MEMBERS' && member.role !== 'MEMBER') return false
      if (!query) return true
      return `${member.user.name} ${member.user.email}`.toLowerCase().includes(query)
    })
  }, [memberSearch, memberTab, members.data])

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

  return (
    <div className="page-split grid gap-6">
      <PageHeader
        kicker="People operations"
        title="Manage project access with a cleaner team hub"
        description="Switch between projects, review the active roster, and keep role ownership sharp without leaving the workspace."
        actions={
          selectedProject ? (
            <Link
              to={`/projects/${selectedProject._id}`}
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-2)]"
            >
              Open selected project
            </Link>
          ) : null
        }
      />

      {err ? <ErrorBox message={err} /> : null}

      {!projects.isLoading && !projects.data?.length ? (
        <Card>
          <EmptyState
            title="Create a project first"
            message="Team management becomes available once you have at least one project workspace. Start there, then come back here for member and role controls."
            action={
              <Link
                to="/projects"
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-2)]"
              >
                Go to projects
              </Link>
            }
          />
        </Card>
      ) : null}

      {!!projects.data?.length && (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <Card title="Project switcher" subtitle="Choose the workspace whose members you want to manage.">
              <div className="grid gap-3">
                {projects.data.map((project) => {
                  const active = project._id === projectId
                  return (
                    <button
                      key={project._id}
                      type="button"
                      className={[
                        'rounded-[24px] border px-4 py-4 text-left transition',
                        active
                          ? 'border-[var(--accent-border)] bg-[var(--accent-soft)]'
                          : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white',
                      ].join(' ')}
                      onClick={() => setProjectId(project._id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-950">{project.name}</div>
                          <div className="mt-2 text-xs leading-5 text-slate-500">{project.description || 'No description yet.'}</div>
                        </div>
                        <Pill tone={project.myRole === 'ADMIN' ? 'violet' : 'slate'}>{project.myRole}</Pill>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{project.memberCount ?? 0} members</span>
                        <span>|</span>
                        <span>{project.taskCount ?? 0} tasks</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card className="mesh-card">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-4">
                <div className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Selected</div>
                  <div className="mt-3 text-xl font-semibold text-slate-950">{selectedProject?.name ?? 'Choose a project'}</div>
                </div>
                <div className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Members</div>
                  <div className="mt-3 text-2xl font-semibold text-slate-950">{members.data?.length ?? 0}</div>
                </div>
                <div className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admins</div>
                  <div className="mt-3 text-2xl font-semibold text-slate-950">
                    {(members.data ?? []).filter((member) => member.role === 'ADMIN').length}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Role</div>
                  <div className="mt-3 text-2xl font-semibold text-slate-950">{selectedProject?.myRole ?? '-'}</div>
                </div>
              </div>
            </Card>
          </div>

          {projectId ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
              <Card title="Roster" subtitle="Search the team, review access, and keep the member list accurate.">
                <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                  <Input
                    label="Search people"
                    placeholder="Filter by name or email"
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
                  <div className="text-sm text-slate-500">Loading roster...</div>
                ) : filteredMembers.length ? (
                  <div className="space-y-3">
                    {filteredMembers.map((member) => {
                      const cannotEdit = member.user.id === selectedProject?.createdBy || member.user.id === auth.user?.id
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
                              <div className="text-sm text-slate-500">Admins control role changes and removals for this project.</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState title="No members match" message="Adjust your search or filters to see the people you need." />
                )}
              </Card>

              {isAdmin ? (
                <Card title="Add member" subtitle="Bring an existing user into this project by email.">
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
                      placeholder="teammate@company.com"
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
                      Add member
                    </Button>
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
                      Demo tip: use the included sample account <span className="font-semibold">member@taskflowpro.demo</span> if you want a fast end-to-end role demo.
                    </div>
                  </form>
                </Card>
              ) : (
                <Card title="Access note" subtitle="You currently have member-level visibility here.">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-600">
                    You can review the roster, but project admins handle invitations, removals, and role changes.
                  </div>
                </Card>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
