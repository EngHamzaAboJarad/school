# Taqat School — UI/UX Redesign Log

Branch: `redesign` · Read this file at the start of every session.

| Session | Scope | Status |
|---|---|---|
| 1 | Stage 1 audit · Stage 2 foundation · Admin roles | **Stage 1 ✅ · Stage 2 ✅ · ⛔ CHECKPOINT — waiting for approval before Stage 3 (admin core screens)** |
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

---

## Stage 2 — Foundation (Session 1) ✅

### How the system is wired
- `src/styles/tokens.css` — new tokens on `:root` (`--c-*` colour, `--sp-*` spacing on a 4 px grid, `--rad-*` 4/6/8/12, `--el-*` elevation, `--fs-*`/`--fw-*` type, `--dur-*` motion, `--z-*`, layout sizes). Breakpoints used literally: 640 / 768 / 1024 / 1280.
- **Scoping:** `AppShell` adds `in-app` to `<body>` (body, because modals and toasts portal there). Inside it the legacy variables (`--muted`, `--line`, `--r-lg`, `--shadow-*`, `--font-display`…) are re-pointed to the new tokens, so every not-yet-redesigned page already inherits the system. Landing and auth never get `in-app`, so they are **unchanged**.
- `src/styles/components.css` — every rule is `:where(.in-app) .x` (same specificity as the legacy `ui.css` rule it replaces). Loaded after `ui.css`/`shell.css` and before `pages.css`/`roles.css`, so legacy page-specific tweaks still win. Ends with the **app motion policy**: no loops, no ripples/spotlights/hover lifts/backdrop blur, 120–180 ms fades only; `prefers-reduced-motion` and Settings › motion-off are honoured.
- `src/styles/shell.css` — rewritten. Global parts kept verbatim (prefs, wordmark, language toggle, Ctrl K palette, settings sessions, LTR helpers); the old `.sidebar/.topbar` rules are replaced by the new `.shell / .sb / .tb / .bn`.
- `src/styles/admin.css` — admin screens (overview so far).
- English strings for new UI: `src/i18n/en.redesign.json` (registered after the existing dictionaries). Check: render with `taqat-lang=en` and look for leftover Arabic text nodes.
- Dev-only component gallery: `#/ui-kit` (`src/dev/UiKit.jsx`, lazy, behind `import.meta.env.DEV` — verified absent from the production bundle).

### Shared components (new / updated)
| Component | File | Status |
|---|---|---|
| App shell: collapsible desktop rail (persisted in `taqat-sidebar`), grouped nav with active bar + counts, breadcrumbs (role › group › page), top bar, notifications popover, profile menu (+ language switch on mobile), mobile drawer, **mobile bottom nav** (4 primary items + "More") | `shell/AppShell.jsx` | rewritten |
| `Btn` variants primary / ghost / soft / gold / danger / **danger-solid** / link / light, sizes sm / lg, icon-only; ≥ 44 px on touch | `ui/Primitives.jsx` + CSS | restyled |
| `Input / Select / Textarea / Field` (hint, error, `aria-invalid`, disabled), `SearchBox` (icon, `role=search`), `Toggle` | Primitives | updated |
| **`MetricCard`** (value from data only, `null` → empty state, delta with arrow + text, meter, tone edge, loading) | Primitives | new |
| `Stat` (legacy metric) | CSS | restyled |
| `DataTable` — **mobile card layout** (`data-label`), `primary` column, `pageSize` pagination, caption, `scope=col` | Primitives | updated |
| **`Pagination` + `usePagination`** | Primitives | new |
| `Tabs`, `Segmented`, `.chip`, `.filter-bar` | CSS | restyled / new |
| `Modal`: focus moved in, Tab trapped, focus restored, `size="sm"`; drawer variant (side sheet); bottom sheet on mobile | Primitives + CSS | updated |
| **`ConfirmProvider` / `useConfirm()`** — promise-based, focus starts on Cancel, danger/warn/info tones | `ui/Confirm.jsx` | new |
| **`Menu`** dropdown (Esc, outside click, arrow keys) | Primitives | new |
| Toasts (`role=status`; success / warn / danger / info icons) | `ui/Brand.jsx` + CSS | updated |
| `Badge`, **`StatusBadge`** (colour + icon + text, never colour alone) | Primitives | restyled / new |
| `Progress` (+ `brand` tone), `Bars` (single series, value label on latest only, per-bar tooltip, descriptive `aria-label`), `HBars`, `Ring` | Primitives / Charts | updated |
| `Empty` (`compact`), **`ErrorState`**, **`Skeleton`**, `Notice` | Primitives | updated / new |
| **`SectionHeader`** | Primitives | new |
| `ListRow` — trailing actions wrap under the text ≤ 640 px | CSS | updated |
| Count-up numbers, ripples, cursor spotlight disabled inside the app (kept on landing) | `ui/motion.js` | updated |

### Admin overview (school › home) — fully redesigned
Every value comes from the store; nothing is a literal in the component.

| Widget | Source |
|---|---|
| Students in classes / classes / responsible teachers | `state.classes` rosters |
| Attendance rate + delta vs previous day + last recorded date | `state.attendance` (present/late/excused ÷ marked) |
| Average mastery + students below 70 % | `classStats()` over all classes (`GAP_THRESHOLD`) |
| Licence seats used + meter + licence status | `state.schools[user.school]` (students / seats / license) |
| Needs action: approvals, unrecorded attendance (+ remind-teacher action), seats/licence, frequent absences, fees due, unread messages; FYI rows: teacher join requests (handled by system admin), content awaiting teacher review | `directory`, `attendance`, `schools`, `teacherPayments`, `threads`, `reviewItems` |
| Daily attendance chart (last 10 recorded days) | `state.attendance` |
| Classes table (teacher, students, mastery, struggling, 14-day attendance) | `classStats()`, `attendanceRate()` |
| Recent operations | `state.audit`, filtered to this school's accounts (previously a hard-coded list of 4 user ids) |

Removed from the overview: the static `school.approval` and `school.active` percentages (no underlying records) — see Missing data.

### Checkpoint evidence — `docs/redesign/after/checkpoint/`
`admin-overview-1440.png`, `admin-overview-375.png`, `admin-overview-1440-en.png` (LTR), `shell-mobile-375.png`, `shell-mobile-drawer-375.png`, `shell-desktop-collapsed-1440.png`, `shell-notifications-1440.png`, `components-1440.png`, `components-375.png`, `components-confirm-dialog-1440.png`, `components-dropdown-1440.png`.

### Route table (Session-1 scope)
| Role | Route | Status | Notes |
|---|---|---|---|
| school | home | **redesigned** | real data only; 375 / 1440 / LTR verified |
| school | users, structure, attendance, reports, licenses, finance, messages | new shell + tokens only | page layouts unchanged → Stage 3/4 |
| system | home, tenants, teacherRequests, leads, rbac, billing, ai, audit, security, integrations | new shell + tokens only | Stage 3/4 |
| supervisor | home, kpis, quality, reports | new shell + tokens only | Stage 3/4 |
| all other roles | all routes | new shell + tokens only | later sessions; swept for errors and overflow |

### Command results (Stage 2)
| Command | Result |
|---|---|
| `npm run build` | ✅ pass — 1675 modules, 0 errors; JS 894 kB (chunk-size warning, pre-existing), CSS 151 kB |
| lint / type-check / tests | not configured in the project (nothing to run) |
| Route sweep: all 46 routes of the 6 roles at 1440 and 375 (RTL) | ✅ 0 console errors, 0 page errors, 0 horizontal overflow (before: the admin overview rendered 486 px wide at 375) |
| English (LTR) check, admin overview | ✅ no untranslated text (only the logo / language-toggle labels, which are `data-notr` by design) |

### Missing data (the store does not provide it)
1. Licence expiry date — the Licenses page computes "expires in 22 days" from the seed time (`now0 + 22 days`); there is no real expiry field. Not shown on the overview.
2. School-level "content approval %" (`school.approval`) and "active users %" (`school.active`) are static numbers on the tenant record with no underlying events. Removed from the overview; still shown on Reports (to revisit in Stage 3).
3. Student count: the tenant record says 1,240 students; class rosters hold 17. The overview shows the roster count (what attendance and mastery are computed on); the licence card shows the tenant figure. Each is labelled.
4. No historical mastery series per school → no trend/delta on the mastery card.
5. Daily attendance is tracked only for classes with secondary (`S-`) subjects (same rule as the Attendance page); the primary class has records for its one student but is excluded from "not recorded today".

### Not verified
- Real touch devices and Safari (only headless Chrome at 375 / 1440).
- Screen-reader pass (structure and labels added, not tested with NVDA/VoiceOver).
- High-contrast and large-text settings on the new overview (tokens wired, not screenshot-checked).

### Run locally
```
npm install
npm run dev     # http://localhost:5173  — admin@taqat.test / password / OTP 123456
                # component gallery (dev only): http://localhost:5173/#/ui-kit
npm run build   # production build into dist/ (dist is committed for deploy; redesign commits leave it alone)
```

### Next (after approval) — Stage 3/4 for the admin roles
School: users (pagination, bulk approve, confirmation on suspend / reject / role change), structure, attendance, reports (replace static % with computed values), licenses, finance (confirm payment), messages. Then system (10 routes) and supervisor (4 routes). Then Stage 5 polish and Stage 6 verification for this scope.
