# OtoAssistant Admin — AI Coding Agent Instructions

## Project Overview
This is the admin panel for OtoAssistant, a WhatsApp AI Chatbot for an auto repair
workshop in Ankara, Turkey. The frontend is Next.js and communicates with an ASP.NET
Core Web API backend. It is a PWA (Progressive Web App) installable on mobile devices.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (Default style, Slate color)
- **Icons:** Lucide React
- **PWA:** @ducanh2912/next-pwa
- **Push Notifications:** Web Push API (VAPID)
- **Font:** Geist (Google Fonts)
- **Package Manager:** npm

## Architecture
- This is a FRONTEND ONLY project — no database, no backend logic here
- All data comes from the ASP.NET backend via REST API calls in `lib/api.ts`
- All API calls must go through `lib/api.ts` — never use fetch() directly in components
- Auth is handled via API key stored in sessionStorage (key: `admin_key`) AND as a
  cookie (key: `admin_key`) for middleware access

## Project Structure
oto-assistant-admin/
├── app/
│ ├── page.tsx # PIN login page
│ ├── layout.tsx # Root layout (Geist font, PWA viewport meta)
│ ├── globals.css # Global styles
│ ├── dashboard/
│ │ └── page.tsx # Today's appointments + stats + notification bell
│ ├── appointments/
│ │ └── page.tsx # All appointments + date/status filters + new appointment dialog
│ ├── customers/
│ │ └── page.tsx # Customer list with debounced search
│ └── services/
│ └── page.tsx # Services CRUD (add / edit / delete)
├── components/
│ ├── BottomNav.tsx # Fixed bottom navigation bar (4 tabs)
│ └── NotificationBell.tsx # Bell icon with unread badge + notification dropdown
├── lib/
│ ├── types.ts # All TypeScript interfaces
│ ├── api.ts # All API fetch functions (single source of truth)
│ ├── push.ts # Push subscription helpers (subscribeToPush, sendSubscriptionToBackend)
│ └── utils.ts # shadcn cn() utility
├── middleware.ts # Auth redirect guard — reads cookie "admin_key"
└── public/
├── sw.js # Service worker (Workbox + push listener at bottom)
├── sw-custom.js # Custom push handler (for next-pwa customWorkerSrc merge)
├── manifest.json # PWA manifest
└── icons/
├── icon-192x192.png
└── icon-512x512.png

## Coding Rules

### General
- Always use TypeScript — no `any` types, define proper interfaces in `lib/types.ts`
- Use App Router conventions — no Pages Router patterns
- Never use `getServerSideProps`, `getStaticProps`, or `pages/` directory
- Use `'use client'` directive only when needed (interactivity, hooks, browser APIs)
- Prefer Server Components by default
- One component per file
- Component file names: PascalCase (e.g. `AppointmentCard.tsx`)
- Page file names: lowercase in folders (e.g. `app/dashboard/page.tsx`)

### Styling
- Use Tailwind CSS utility classes only — no inline styles, no CSS modules
- Mobile-first design — design for 375px screen first
- Bottom navigation for mobile — 4 tabs: Panel, Randevular, Müşteriler, Hizmetler
- UI language is Turkish — all labels, buttons, error messages, and placeholders in Turkish
- All comments in English

### API Calls
- All fetch calls live in `lib/api.ts` — import functions from there
- Always send `X-Admin-Key` header (read from sessionStorage key `admin_key`)
- API base URL comes from `NEXT_PUBLIC_API_URL` environment variable
- Handle loading, error, and empty states in every component that fetches data
- Never use fetch() directly in components

### Components
- Use shadcn/ui components for all UI elements (Button, Card, Badge, Input, Dialog, etc.)
- Import shadcn components from `@/components/ui/`
- Never rebuild what shadcn provides
- Never install or use other UI libraries (MUI, Ant Design, Chakra, etc.)
- Combine shadcn/ui with Tailwind utility classes for layout and spacing

## Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:5292
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here

- `NEXT_PUBLIC_ADMIN_KEY` — only as default/fallback, real key always comes from sessionStorage
- Never hardcode API URLs — always use `NEXT_PUBLIC_API_URL`

## Authentication Flow
1. User visits `/` (login page)
2. Enters PIN → verified by calling `GET /api/admin/appointments/today` with that PIN as `X-Admin-Key`
3. On success:
   - PIN saved to `sessionStorage` as `admin_key`
   - PIN saved as cookie `admin_key` (for middleware)
4. Redirect to `/dashboard`
5. `middleware.ts` protects all routes except `/` — checks cookie `admin_key`
6. Logout: clears sessionStorage + cookie → redirects to `/`

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
| POST | `/api/admin/push/subscribe` | Save browser push subscription to DB |
| POST | `/api/admin/push/test` | Send a test push notification (dev only) |
| GET | `/api/admin/notifications` | Get notifications list + unread count |
| PATCH | `/api/admin/notifications/{id}/read` | Mark single notification as read |
| PATCH | `/api/admin/notifications/read-all` | Mark all notifications as read |

## AppointmentStatus Enum
The backend uses English enum string values — map to Turkish in the UI:
| Backend value | Turkish label |
|---------------|---------------|
| `Pending` | Bekliyor |
| `Confirmed` | Onaylandı |
| `Cancelled` | İptal |

## Push Notifications
- VAPID public key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Flow:
  1. User clicks bell icon on dashboard → browser permission prompt
  2. `subscribeToPush()` in `lib/push.ts` creates PushSubscription
  3. Subscription sent to `POST /api/admin/push/subscribe`
  4. On new appointment: backend `PushService.SendToAllAsync()` fires
  5. `sw.js` receives push event → shows OS notification
  6. Clicking notification navigates to `/dashboard`
- Bell states:
  - `idle` → animated pinging bell → click to subscribe
  - `subscribed` → replaced by `<NotificationBell />` with dropdown
  - `denied` → greyed out BellOff icon, disabled

## ⚠️ Known Issue — sw.js Push Listener
`public/sw.js` is regenerated on every `npm run dev` restart by next-pwa.
The push event listener added at the bottom of `sw.js` will be **deleted** on restart.

**After every dev server restart:**
1. Open `public/sw.js`
2. Scroll to the very bottom
3. Add the push listener block from `public/sw-custom.js`
4. Save the file
5. In DevTools → Application → Service Workers → click "Update"

This is a known limitation of `@ducanh2912/next-pwa` in development mode.
In production builds (`npm run build`) the `customWorkerSrc` merge works correctly.

## Notification Center (NotificationBell)
- Polls `GET /api/admin/notifications` every 30 seconds
- Shows red badge with unread count on bell icon
- Dropdown lists last 50 notifications with relative time ("5 dk önce")
- Click notification row → marks as read, navigates to notification URL
- "Tümünü okundu işaretle" → marks all as read

## PWA Configuration
```json
// public/manifest.json
{
  "name": "OtoAssistant Yönetim",
  "short_name": "OtoAsistan",
  "description": "Oto tamir atölyesi yönetim paneli",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#0f172a",
  "orientation": "portrait",
  "lang": "tr",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

## DO NOT
- Do not use Pages Router
- Do not use `getServerSideProps` or `getStaticProps`
- Do not call fetch() directly in components — use `lib/api.ts`
- Do not hardcode API URLs — use `NEXT_PUBLIC_API_URL`
- Do not use localStorage — use sessionStorage (PWA iframe/cookie compatibility)
- Do not add backend logic, database connections, or server actions to this project
- Do not use `any` TypeScript type
- Do not write English UI text — all UI text must be in Turkish
- Do not rebuild UI components that shadcn/ui already provides
- Do not import from other UI libraries — shadcn/ui + Tailwind is the only UI layer
- Do not push to GitHub directly — developer handles all git commands manually