import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './ui/AppShell'
import { LoginPage } from './views/LoginPage'
import { SignupPage } from './views/SignupPage'
import { DashboardPage } from './views/DashboardPage'
import { ProjectsPage } from './views/ProjectsPage'
import { ProjectPage } from './views/ProjectPage'
import { TeamPage } from './views/TeamPage'
import { RequireAuth } from './state/auth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:projectId', element: <ProjectPage /> },
      { path: 'team', element: <TeamPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
])
