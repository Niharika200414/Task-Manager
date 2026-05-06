export type Role = 'ADMIN' | 'MEMBER'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type UserSummary = {
  id: string
  name: string
  email: string
}

export type Member = {
  user: UserSummary
  role: Role
  joinedAt?: string
}

export type Project = {
  _id: string
  name: string
  description?: string
  myRole?: Role
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  taskCount?: number
  completedTaskCount?: number
  overdueTaskCount?: number
  highPriorityTaskCount?: number
  memberCount?: number
  adminCount?: number
  completionRate?: number
}

export type Task = {
  _id: string
  projectId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string | null
  assignedTo?: string
  createdBy: string
  assignee?: UserSummary | null
  creator?: UserSummary | null
  createdAt?: string
  updatedAt?: string
}

export type DashboardTaskCard = {
  _id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string | null
  projectId: string
  projectName: string
  updatedAt?: string
}

export type DashboardProject = Project & {
  nextDueDate?: string | null
}

export type DashboardData = {
  summary: {
    totalProjects: number
    adminProjects: number
    memberProjects: number
    tasksAssignedToMe: number
    completedTasks: number
    overdueTasks: number
    completionRate: number
  }
  myTasksByStatus: Record<TaskStatus, number>
  overdue: DashboardTaskCard[]
  upcoming: DashboardTaskCard[]
  recentProjects: DashboardProject[]
}
