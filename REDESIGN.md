# Taqat School — UI/UX Redesign Log

Branch: `redesign` · Read this file at the start of every session.

| Session | Scope | Status |
|---|---|---|
| 1 | Stage 1 audit · Stage 2 foundation · Admin roles | **Stage 1 ✅ · Stage 2 in progress** |
| 2 | Teacher | not started |
| 3 | Student + Parent | not started |
| 4 | "النجمة" AI assessment + polish + final verification | not started |

---

## Stage 1 — Audit (Session 1)

### Stack (verified from code)
- **Vite 6 + React 19**, plain JS/JSX, **lucide-react** icons. No router library: hash routing in `src/lib/router.js` (`#/page/param`).
- **No backend.** All data lives in one reducer store (`src/store/StoreProvider.jsx`) seeded by `src/data/seed.js` and persisted to `localStorage` (`taqat-state-v6`). "API calls" = `dispatch({type})` actions (≈60 action types) + read selectors in `src/store/selectors.js`. "Real data" in this redesign therefore means **values read from the store/selectors** — never literals inside components.
- Auth: `src/auth/AuthScreen.jsx` — demo accounts, password + 6-digit OTP, role → `state.session`.
- i18n: UI written in Arabic; English is produced by a live DOM translator (`src/i18n/index.jsx` + `en.json`/`en.extra.json`). New Arabic strings need dictionary entries or they stay Arabic in EN mode.
- Prefs (Settings): text size (`html[data-textsize]`), high contrast (`html[data-contrast]`), motion off (`html[data-motion]`). **No dark theme** → none added.
- Styles: global CSS in `src/styles/` (theme, ui, shell, pages, roles, auth, landing, motion). Primitives in `src/ui/Primitives.jsx`, charts in `src/ui/Charts.jsx` (hand-rolled SVG/CSS).
- `dist/` is committed (deploy output). Redesign commits do **not** touch `dist/`.

### Scripts & build status (baseline, before any change)
| Command | Result |
|---|---|
| `npm install` | ✅ 0 vulnerabilities (esbuild postinstall blocked by npm allowScripts — build still works) |
| `npm run build` | ✅ pass — 1670 modules, JS 868 kB (warning: chunk > 500 kB), CSS 110 kB |
| lint / type-check / tests | ❌ **not configured** (no eslint, no TypeScript, no test runner in `package.json`) |
| Browser console (all 6 roles, home + admin pages) | ✅ 0 errors |

### Roles (6, from `src/data/people.js`)
student · parent · teacher · **school** (school administration = "Admin") · supervisor · system (platform admin).
Session-1 "Admin" scope = **school + system + supervisor** (all administrative roles; supervisor is not listed in any other session).

### Routes (nav ids from `src/data/nav.js`; unknown ids fall back to `home`)
| Role | Routes |
|---|---|
| student | home, learn (+ `lesson/:id`, `exam/:unitId`), progress (+ `plan`), schedule, library, rewards, teachers, messages (+ `to/:id`) |
| parent | home, child, attendance, reports, messages, privacy |
| teacher | home, classes, performance, review, curriculum, bank, grading, assignments, attendance, enrollments, finance, messages |
| school (Admin) | home, users, structure, attendance, reports, licenses, finance, messages |
| supervisor | home, kpis, quality, reports |
| system | home, tenants, teacherRequests, leads, rbac, billing, ai, audit, security, integrations |
| public | `#/` landing, `#/login` (+ flow param) |

### Shared components found
`Btn, Page, Card, Stat, Badge, Tabs, Segmented, Modal (also drawer), Field, Input, Select, Textarea, Toggle, Progress, Avatar, Empty, ListRow, Notice, DataTable, Grid, Split, SearchBox` (Primitives) · `Ring, Bars, HBars, LineChart…` (Charts) · `ToastProvider/useToast, LogoMark, Wordmark` (Brand) · `AppShell` (sidebar, topbar, notifications, profile menu, Ctrl+K palette) · `SettingsDialog` · `Messages` (shared by 4 roles).
**Missing:** confirmation dialog, dropdown menu, skeleton, error state, pagination, mobile table layout, metric card with real trend/state, bottom mobile nav, collapsible desktop sidebar.

### Issues found (before)
1. **Horizontal overflow at 375 px** on the admin overview (page renders 486 px wide; avatar clipped).
2. Decorative "AI-dashboard" look: gradient hero with glow + star pattern, gradient buttons, serif (Amiri) 40 px page titles and metric numbers, spotlight-on-hover cards.
3. Motion layer (`motion.css` / `motion.js`): infinite bell shake, pulsing badges, shimmer on progress bars, floating empty icons, ripples, stagger cascades of 0.5–1.5 s — conflicts with "subtle, fast" and is distracting in operational screens.
4. Admin overview metrics (students 1,240, attendance 97.2 %, approval 96 %) come from the static tenant record `state.schools[sch-1]`, while the store has real attendance records, review items and class mastery that disagree with them. The approval % and attendance % can be computed from real records.
5. Semantic text colors below WCAG AA on their tinted backgrounds (warn `#b27a14` on `#fbf0d6` = 3.26:1; success `#1f8a64` on `#e3f4ec` = 3.78:1; danger 4.41:1; info 4.42:1; faint text `#97a2b3` on white 2.58:1).
6. Destructive actions (suspend user, reject, revoke API key, remove schedule) run immediately with no confirmation.
7. Tables have no pagination and no mobile layout (horizontal scroll only).
8. Comment headers in `ui.css`/`shell.css` are mojibake (encoding damage, comments only).
9. "النجمة" AI assessment: **no feature by that name exists.** The AI-related flow is essay pre-grading (`aiGradeEssay`) → teacher confirmation in Teacher › Grading (`essay.final`). Session 4 will treat that flow as the AI assessment unless told otherwise.

### Plan (≤ 20 lines)
1. Tokens in `src/styles/tokens.css`: brand navy + ochre kept; semantic surface/text/status tokens with AA-checked pairs; 4 px spacing scale; radii 6/8/12; 3 shadow levels; type scale with compact headings; motion durations; z-index; breakpoints (documented).
2. Old variable names stay as aliases, so pages not yet redesigned keep rendering.
3. Rewrite `ui.css` (components) + `shell.css` (shell) on the tokens; keep every existing class name the pages use.
4. App motion policy: no infinite or decorative animation inside `.app`; 120–200 ms fades only; ripple/spotlight disabled in the app; landing untouched.
5. New shared components: `ConfirmDialog`, `Menu` (dropdown), `Skeleton`, `ErrorState`, `Pagination` + `usePagination`, `MetricCard`, `StatusBadge`, `PageHeader`, `SectionHeader`, responsive `DataTable` (cards on mobile), plus `Drawer` (Modal variant).
6. Shell: collapsible desktop sidebar (persisted), grouped nav with clear active state, breadcrumbs, mobile top bar + bottom nav (4 primary items + "More").
7. Redesign Admin overview (school home) from real store data only → **checkpoint**.
8. After approval: Admin core screens (users, structure, attendance, reports) → remaining admin/system/supervisor routes → polish → verify.

### Demo accounts (seeded by the app itself; no seed script needed)
Password `password`, OTP `123456`.
| Role | Email | Notes |
|---|---|---|
| Admin (school) | admin@taqat.test | أ. عبدالله الشمري |
| System admin | system@taqat.test | |
| Supervisor | supervisor@taqat.test | |
| Teacher | teacher@taqat.test | 2 classes (c-3a, c-3b) |
| Parent | parent@taqat.test | linked to **2 students**: سارة (c-3a) and ليان (c-6b) |
| Student | student@taqat.test | سارة أحمد, has attempts, mastery, remedial plan |
Seed data includes 3 classes, 17 students, units/lessons/questions, attempts, essay grades, review queue, attendance history, assignments, threads, invoices, audit log. Reset: Settings › reset demo data.

### Before screenshots
`docs/redesign/before/` — `{role}-{page}-{width}.png` at 1440 and 375 (RTL): all 8 school routes + home of every other role.
