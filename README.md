# Student Management System

A full-stack Next.js 16 application for managing a student registry. Built with the App Router, MUI 9 (Material UI), MUI X Data Grid, MUI X Charts, Emotion, better-sqlite3, and Zod.

## Features

- **Dashboard** – KPI cards, major breakdown (BarChart), status distribution (PieChart), top performers and recent enrollments.
- **Student directory** – Server-side paginated Data Grid with debounced search, filters (status/grade/major), sortable columns and quick CRUD actions.
- **Student profile** – Detailed view with academic standing, editable notes/address and safe deletion with confirmation.
- **Create / edit** – Validated MUI form with client-side Zod validation and server-side checks for duplicates (roll number / email).
- **API routes** – RESTful `GET/POST /api/students`, `GET/PUT/DELETE /api/students/:id`, `GET /api/stats` backed by SQLite.
- **Theming** – Light/dark mode persisted to `localStorage`, Roboto font via `next/font`, MUI theme with CSS variables.
- **Next.js 16 ready** – Uses App Router, Route Handlers, `RouteContext` types, `connection()` to avoid static prerendering of live data, and `@mui/material-nextjs` App Router cache provider.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first run a SQLite database is created at `data/students.db` and seeded with sample students.

## Scripts

- `npm run dev` – Start the dev server
- `npm run build` – Production build
- `npm run start` – Start the production server
- `npm run lint` – Run ESLint

## Project structure

```
src/
  app/              # App Router pages and API route handlers
  components/       # Client components (AppShell, theme, dashboard, students)
  lib/              # DB, validation, types, HTTP helpers, API client
```

## Notes

- The database file lives in `data/` (ignored by default). Set `DATABASE_PATH` to use a different location.
- API routes run on the Node.js runtime (`runtime = 'nodejs'`) because `better-sqlite3` is a native module.
- MUI X v9 Data Grid props differ from older versions; this project uses the v9 API (`paginationMode`, `rowCount`, `paginationModel`, `sortingMode`).
- If you see issues with Next.js 16 cache semantics, routes that return live data call `connection()` to opt out of prerendering.
