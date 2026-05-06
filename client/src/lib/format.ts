import type { TaskPriority, TaskStatus } from './types'

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return 'No due date'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatShortDate(value?: string | Date | null) {
  if (!value) return 'No date'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function percentage(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export function toDateTimeLocal(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

export function describeDueDate(value?: string | null) {
  if (!value) return 'No due date'

  const now = new Date()
  const due = new Date(value)
  const dayMs = 24 * 60 * 60 * 1000
  const diff = Math.round((due.getTime() - now.getTime()) / dayMs)

  if (diff === 0) return `Due today, ${formatDateTime(value)}`
  if (diff === 1) return `Due tomorrow, ${formatDateTime(value)}`
  if (diff === -1) return `Was due yesterday, ${formatDateTime(value)}`
  if (diff > 1) return `Due in ${diff} days`
  return `${Math.abs(diff)} days overdue`
}

export function statusLabel(status: TaskStatus) {
  return status === 'IN_PROGRESS' ? 'In progress' : status === 'DONE' ? 'Done' : 'To do'
}

export function priorityLabel(priority: TaskPriority) {
  return priority === 'MEDIUM' ? 'Medium' : priority === 'HIGH' ? 'High' : 'Low'
}
