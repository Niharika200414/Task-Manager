# TaskFlow Studio

A polished full-stack team task manager for **projects**, **members**, and **tasks** with **role-based access control** for **Admin** and **Member** experiences.

## Tech

- **Backend**: Node.js + Express + MongoDB (Mongoose) + Zod validation + JWT auth
- **Frontend**: React (Vite) + React Router + React Query + Tailwind CSS (responsive)
- **Experience upgrades**: modern dashboard, project board, team hub, project settings, demo seed data, improved session restore

## Getting started

### 1) Start MongoDB

Make sure MongoDB is running locally (default connection is `mongodb://127.0.0.1:27017/team_task_manager`).

### 2) Run the API

```bash
cd server
npm install
npm run dev
```

Server runs on `http://localhost:4000`.

Environment file: `server/.env` (example in `server/.env.example`).

The API now accepts local Vite origins like `http://localhost:5173` and `http://localhost:5174` during development.

### 3) Seed sample admin/member data

```bash
cd server
npm run seed:demo
```

Demo credentials:

- `admin@taskflowpro.demo / DemoPass123!`
- `member@taskflowpro.demo / DemoPass123!`

### 4) Run the web app

```bash
cd client
npm install
npm run dev
```

Client usually runs on `http://localhost:5173`, but Vite may pick `http://localhost:5174` if the first port is busy.

## Key endpoints (REST)

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/dashboard`
- `POST /api/projects`
- `GET /api/projects`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `GET /api/projects/:projectId`
- `GET /api/projects/:projectId/members`
- `POST /api/projects/:projectId/members` (Admin)
- `PATCH /api/projects/:projectId/members/:userId` (Admin)
- `DELETE /api/projects/:projectId/members/:userId` (Admin)
- `POST /api/projects/:projectId/tasks`
- `GET /api/projects/:projectId/tasks`
- `PATCH /api/projects/:projectId/tasks/:taskId`
- `DELETE /api/projects/:projectId/tasks/:taskId`

## RBAC (project-scoped)

- **Admin**: manage members, assign tasks, edit/delete anything in project
- **Member**: view project/members; edit tasks they created or are assigned to

## Product highlights

- Beautiful modern UI across auth, dashboard, projects, team, and project detail screens
- Project board with task creation, editing, filtering, reassignment, and deletion
- Team management with role updates and safe removal controls
- Project settings with update and delete flows
- Sample demo workspace with seeded admin/member accounts
