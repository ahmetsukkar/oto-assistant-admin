# OtoAssistant Admin — AI Coding Agent Instructions

## Project Overview
This is the admin panel for OtoAssistant, a WhatsApp AI Chatbot for an auto repair
workshop in Ankara, Turkey. The frontend is Next.js and communicates with an ASP.NET
Core Web API backend.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (Default style, Slate color)
- **Icons:** Lucide React
- **PWA:** next-pwa
- **Package Manager:** npm

## Architecture
- This is a FRONTEND ONLY project — no database, no backend logic here
- All data comes from the ASP.NET backend via REST API calls in `lib/api.ts`
- All API calls must go through `lib/api.ts` — never use fetch() directly in components
- Auth is handled via API key stored in sessionStorage (key: "admin_key")

## Project Structure
- `app/` — Next.js App Router pages
- `components/` — Reusable React components
- `lib/api.ts` — All API call functions (single source of truth)
- `public/` — Static assets, PWA manifest, icons

## Coding Rules
- Use shadcn/ui components for all UI elements (Button, Card, Badge, Input, Dialog, etc.)
- Import shadcn components from `@/components/ui/` — never rebuild what shadcn provides
- Combine shadcn/ui components with Tailwind utility classes for layout and spacing
- Never install or use other UI libraries (MUI, Ant Design, Chakra, etc.)

### General
- Always use TypeScript — no `any` types, define proper interfaces
- Use App Router conventions — no Pages Router patterns
- Never use `getServerSideProps`, `getStaticProps`, or `pages/` directory
- Use `'use client'` directive only when needed (interactivity, hooks, browser APIs)
- Prefer Server Components by default

### Styling
- Use Tailwind CSS utility classes only — no inline styles, no CSS modules
- Mobile-first design — design for 375px screen first
- Bottom navigation for mobile — 4 tabs: Dashboard, Appointments, Customers, Services
- UI language is Turkish — all labels, buttons, and messages in Turkish

### API Calls
- All fetch calls live in `lib/api.ts` — import functions from there
- Always send `X-Admin-Key` header from sessionStorage
- API base URL comes from `NEXT_PUBLIC_API_URL` environment variable
- Handle loading and error states in every component that fetches data

### Components
- One component per file
- Component file names: PascalCase (e.g. `AppointmentCard.tsx`)
- Page file names: lowercase in folders (e.g. `app/dashboard/page.tsx`)

### Environment Variables
- `NEXT_PUBLIC_API_URL` — ASP.NET backend base URL
- `NEXT_PUBLIC_ADMIN_KEY` — only used as default/fallback, real key comes from sessionStorage

## Backend API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/appointments/today` | Today's appointments |
| GET | `/api/admin/appointments?date=&status=` | All appointments with filters |
| POST | `/api/admin/appointments` | Book new appointment |
| PATCH | `/api/admin/appointments/{id}/status` | Update appointment status |
| GET | `/api/admin/customers?search=` | Customer list |
| GET | `/api/admin/services` | All services |
| POST | `/api/admin/services` | Add service |
| PUT | `/api/admin/services/{id}` | Update service |
| DELETE | `/api/admin/services/{id}` | Delete service |

## Authentication
- Login page at `/` (root)
- User enters PIN → stored as `admin_key` in sessionStorage
- Every API request sends `X-Admin-Key: <value from sessionStorage>`
- `middleware.ts` redirects unauthenticated users to `/`
- After login, redirect to `/dashboard`

## DO NOT
- Do not use Pages Router
- Do not use `getServerSideProps` or `getStaticProps`
- Do not call fetch() directly in components — use `lib/api.ts`
- Do not hardcode API URLs — use `NEXT_PUBLIC_API_URL`
- Do not use localStorage — use sessionStorage (PWA iframe compatibility)
- Do not add backend logic, database connections, or server actions to this project
- Do not use `any` TypeScript type
- Do not write English UI text — all UI text must be in Turkish
- Do not rebuild UI components that shadcn/ui already provides
- Do not import from other UI libraries — shadcn/ui + Tailwind is the only UI layer