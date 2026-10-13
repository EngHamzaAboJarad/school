# Product

<!-- impeccable:product-schema 1 -->

> Written from repository evidence (`Taqat-School-Competitive-Feature-Doc (1).docx`, `FEATURE-COVERAGE.md`, source code) after the owner asked for an expert-level redesign of every role and delegated the decisions. Facts marked *(inferred)* were not confirmed in words.

## Platform

web

## Users
Six roles share one product, each with its own dashboard (doc §5):
- **Student** (intermediate/secondary, Saudi curriculum): studies a lesson, reads its summary, takes the after-lesson quiz and unit exams, follows a remedial plan. Uses it at home, often on a phone *(inferred)*.
- **Parent**: follows one or more children (the demo parent has two), sees results, attendance, alerts, reports; messages teachers.
- **Teacher**: approves AI-generated content before students see it, manages the question bank, grades essays the AI pre-scored, runs classes, attendance, assignments, enrollments.
- **School administration**: users and roles, classes and timetables, attendance, institutional reports, licence, teacher fees, announcements.
- **Educational supervisor** (education department / ministry level): compares schools in scope, KPIs, content-quality review, reports.
- **System admin**: tenants, teacher join requests, leads, RBAC, billing, AI-engine governance, audit log, security, integrations.

## Product Purpose
An Arabic AI school: explains the curriculum, summarises every lesson, tests after every lesson and every unit, diagnoses each student's gaps and builds a remedial plan, while every role turns the same data into decisions. Success: a student always knows the next step, and a teacher or administrator can act on what the data shows within a minute.

## Positioning
Competitors in Saudi Arabia (معلمي، تدريس أون لاين) sell hours of a human tutor. Taqat is "a digital school that teaches, assesses and is run by data": explanation + summary + automatic assessment + an institutional role system in one Arabic product. The AI assessment engine is called **النجمة**.

## Operating Context
- Saudi and Gulf market, Saudi school calendar (Sunday–Thursday school week), Vision 2030 digitisation context.
- Human in the loop is a value, not a feature: no AI-generated quiz, summary or essay grade reaches a student before a teacher approves it; every sensitive action is written to the audit log.
- Arabic-first, RTL. English (LTR) is supported through a live translator; lesson and question text stays Arabic.

## Capabilities and Constraints
- React 19 + Vite, plain JS, lucide-react icons, hash routing (`#/page/param`). No backend: one reducer store persisted to `localStorage`; the AI is a deterministic simulation that a real engine will replace without UI changes.
- Routes, reducer actions, data model, parent–child links and the approval workflows must not change.
- Settings already offer text size, high contrast and motion off; there is no dark theme.
- No large new dependencies.

## Brand Commitments
- Name: طاقات سكول / Taqat School. Logo: the geometric «ط» with a spark (`src/ui/Brand.jsx`, favicon in `index.html`). Must be kept.
- Identity colours found in code: navy (`#0e1b33`–`#22364f`) and ochre/gold (`#ddbe84`, `#a9822f`); green is reserved for success/mastery.
- Team: Palestinian teachers and engineers from Gaza (doc cover).

## Evidence on Hand
- Demo data seeded by the app (`src/data/seed.js`): 3 classes, 17 students, lessons, questions, attempts, attendance, audit log. Demo accounts `*@taqat.test`, password `password`, OTP `123456`.
- No real customers, testimonials, usage numbers or market figures; the doc explicitly leaves market numbers unverified. Do not invent any.

## Product Principles
1. The next action first: every dashboard opens on what this role should do now, from real data.
2. Human approval is visible: AI-suggested and teacher-confirmed results never look the same.
3. Data only: a number on screen comes from records; missing data is shown as missing.
4. Arabic is the original, not a translation: RTL layout, Arabic typography and numerals handled with care.
5. Calm under daily use: people open this every school day; nothing loops or competes for attention.

## Accessibility & Inclusion
Minors' data protection (PDPL). WCAG AA contrast, keyboard access, reduced motion, text-size and high-contrast settings must keep working.
