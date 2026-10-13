---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: ["src/shell/AppShell.jsx","src/roles"]
---

# Taqat School app (all signed-in roles)

Scope: every signed-in surface (student, parent, teacher, school admin, supervisor, system admin) and the shared shell. Visitor mode: Operate. Landing and auth are out of scope.

Audience and job: six roles, one store. Each opens the app to act on today: a student continues learning, a parent checks a child, a teacher approves and grades, an administrator decides on accounts, attendance and licences, a supervisor compares schools, a system admin governs tenants and the AI engine.

Constraints: routes, reducer actions and data model unchanged; real store data only, missing data shown as missing; RTL first, English via the live translator; lucide-react icons; no large dependencies; Settings text size, high contrast and motion off keep working.

Chosen direction: Najdi clay and painted door (user chose it over the textbook-cover pick, the wayfinding challenger and the canon).

## Direction contract

THESIS: The school is a Najdi courtyard. Calm lime-washed walls hold the work, the painted indigo door is the way in, and the triangular wall vents become the product's one data glyph. It refuses the grey SaaS dashboard with KPI hero cards and a blue accent, and the decorative gradient hero.

OWN-WORLD: Indigo door shell (#1B2745) with ochre (#D9B26A) marks; lime-wash ground (#F2F1EC) and whitewash panels (#FBFBF8) edged by 1px clay-tinted lines, no floating shadows. Clay (#A8652F) for structure and the lead data series; door paints give every subject a fixed colour; madder red, saffron and a door-teal green carry danger, warning and success. Kufi headings (Noto Kufi Arabic), IBM Plex Sans Arabic for UI and tabular numerals. Soft-square corners: 6px controls, 10px panels. Signature move: rows of small triangular vents, filled for present, done or mastered, hollow for absent or not done, half-tinted for late or partial; used for attendance, mastery, streaks and completion in every role, and nowhere as ornament. Teacher-approved results carry a clay seal; AI-suggested ones carry a dashed outline and the words مقترح آليًّا.

STORY: Every role reads, top to bottom: what needs me today (from real data), the wall of vents for the state of the week, then the working lists and tables. Nothing loops; state changes are short fades.

FIRST VIEWPORT: Admin at 1440. Indigo rail on the right, 248px: wordmark, school, grouped navigation, ochre counts, active item a lime-wash block with a clay edge mark. Lime-wash ground; a 56px top bar with breadcrumb, search, bell and profile. Kufi title لوحة الإدارة with school and date, and one inline fact line (students, last-day attendance, mastery, seats). Below, «قرارات اليوم» over 7 columns with an action per row, and «جدار الحضور» over 5: one vent row per class for the last ten school days, with its rate. Then the classes table with subject colour spines, and the activity log.

FORM: Najdi architecture (mud brick, lime plaster, painted doors, triangular vents), position 5 of 7 on my ordered list; seed key f73199a2.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Subject colours are authored, not taken from an official source.
- Kufi heading face is loaded from Google Fonts like the existing faces (self-hosting deferred).
