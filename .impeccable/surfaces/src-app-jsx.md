---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: ["src/shell/AppShell.jsx","src/roles"]
---

# Mushriq (مشرق) app (all signed-in roles)

Scope: every signed-in surface (student, parent, teacher, school admin, supervisor, system admin) and the shared shell. Visitor mode: Operate. Landing and auth are out of scope.

Audience and job: six roles, one store. Each opens the app to act on today: a student continues learning, a parent checks a child, a teacher approves and grades, an administrator decides on accounts, attendance and licences, a supervisor compares schools, a system admin governs tenants and the AI engine.

Constraints: routes, reducer actions and data model unchanged; real store data only, missing data shown as missing; RTL first, English via the live translator; lucide-react icons; no large dependencies; Settings text size, high contrast and motion off keep working.

Chosen direction: **Mushriq sunrise** — set by the owner's new brand identity (October 2026), replacing the earlier Najdi clay-and-door world.

## Direction contract

THESIS: Every school day is a sunrise. Bright white panels on a cool morning ground, the navy of the wordmark for reading and acting, the sun for the brand's warm moments, teal for growth. Personality from the brand card: inspiration, vitality, optimism — calm enough for daily operational use.

OWN-WORLD: Light white sidebar carrying the full-colour logo; active item a soft navy pill with a sun-gradient edge; sun-gold counts. Morning ground #F3F7FA, white panels with 16px corners and a soft navy-tinted lift; 10px controls. Navy #004F87 primary buttons; the sun (#FEC443→#FDB430, navy text) for the one warm call to action. Rubik headings (rounded, closest to the wordmark), IBM Plex Sans Arabic for UI and tabular numerals. Signature data glyph: **rays** — rounded capsules taken from the logo's sun rays: filled = present/done/mastered, hollow = absent/not done, lower half filled = late/partial, red = absence/gap, dotted = no data; used for attendance, mastery, streaks and completion, never as ornament. The next-step panel is the "sunrise panel": deep navy, a faint rising sun behind its actions, a navy→teal horizon along its foot. Teacher-approved = solid teal seal; AI suggestion (النجمة) = dashed warm outline «مقترح آليًّا». Tab and timetable "now" marks are the sun.

STORY: Every role reads, top to bottom: what needs me today (from real data), the wall of rays for the state of the week, then the working lists and tables. Nothing loops; state changes are short fades.

FIRST VIEWPORT: Admin at 1440. White rail on the right, 252px: colour logo, school card with a horizon line, grouped navigation. Morning ground; 60px top bar with breadcrumb, search, language, bell and profile. Rubik title لوحة الإدارة with school and date and one fact line. Below, «قرارات اليوم» and «جدار الحضور» (one ray row per class for the last ten school days), then the classes table and the activity log.

FINISH: brand master in docs/brand/; screenshots in docs/redesign/after/mushriq/.

## Unresolved
- Subject colours are authored, not taken from an official source.
- Rubik and IBM Plex Sans Arabic are loaded from Google Fonts (self-hosting deferred).
- The logo is a vector rebuild of a raster brand card; a designer's master SVG should replace `LogoMark` when available.
