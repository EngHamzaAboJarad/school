# Graph Report - C:\Users\hp\Desktop\taqat_school  (2026-09-22)

## Corpus Check
- 72 files · ~50,824 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 408 nodes · 700 edges · 25 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 278 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `useStore()` - 64 edges
2. `useToast()` - 48 edges
3. `cx()` - 26 edges
4. `fmtLongDate()` - 13 edges
5. `StudentHome()` - 12 edges
6. `allObjectives()` - 12 edges
7. `reducer()` - 12 edges
8. `studentOf()` - 11 edges
9. `snapshot()` - 11 edges
10. `Split()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `register()` --calls--> `Split()`  [INFERRED]
  C:\Users\hp\Desktop\taqat_school\src\i18n\index.jsx → C:\Users\hp\Desktop\taqat_school\src\ui\Primitives.jsx
- `reducer()` --calls--> `generateFromLesson()`  [INFERRED]
  C:\Users\hp\Desktop\taqat_school\src\store\StoreProvider.jsx → C:\Users\hp\Desktop\taqat_school\src\lib\grading.js
- `LearnPage()` --calls--> `Split()`  [INFERRED]
  C:\Users\hp\Desktop\taqat_school\src\roles\student\Learn.jsx → C:\Users\hp\Desktop\taqat_school\src\ui\Primitives.jsx
- `Step()` --calls--> `cx()`  [INFERRED]
  C:\Users\hp\Desktop\taqat_school\src\roles\student\Progress.jsx → C:\Users\hp\Desktop\taqat_school\src\ui\Primitives.jsx
- `Routed()` --calls--> `useStore()`  [INFERRED]
  C:\Users\hp\Desktop\taqat_school\src\App.jsx → C:\Users\hp\Desktop\taqat_school\src\store\StoreProvider.jsx

## Communities

### Community 0 - "Community 0"

Cohesion: 0.04
Nodes (51): AiPage(), MODELS, correctText(), GradeCell(), NewAssignment(), STATUS, AuditPage(), BillingPage() (+43 more)

### Community 1 - "Community 1"

Cohesion: 0.07
Nodes (44): AssignmentsPage(), BankPage(), ST, CurriculumPage(), STATUS, ExamPage(), LearnPage(), Path() (+36 more)

### Community 2 - "Community 2"

Cohesion: 0.09
Nodes (28): AR, ATTRS, cache, CAP, Ctx, current, exact, fill() (+20 more)

### Community 3 - "Community 3"

Cohesion: 0.09
Nodes (20): answerFromLesson(), STOP, tokens(), masteryTone(), Ring(), Spark(), MIN, aiGradeEssay() (+12 more)

### Community 4 - "Community 4"

Cohesion: 0.1
Nodes (20): ATT, AttendancePage(), ParentAttendance(), SchoolAttendance(), ChildPage(), fmtLongDate(), ParentHome(), SchoolHome() (+12 more)

### Community 5 - "Community 5"

Cohesion: 0.12
Nodes (24): AppShell(), QuestionView(), Avatar(), Badge(), Btn(), Card(), cx(), DataTable() (+16 more)

### Community 6 - "Community 6"

Cohesion: 0.1
Nodes (16): PAGES, Routed(), flatNav(), ICONS, NAV, pageLabel(), parse(), useRoute() (+8 more)

### Community 7 - "Community 7"

Cohesion: 0.09
Nodes (21): A, classA, classB, DEMO_ACCOUNTS, E, M, Pe, PERIODS (+13 more)

### Community 8 - "Community 8"

Cohesion: 0.12
Nodes (5): DEMO_CODE, DEMO_PASSWORD, FLOWS, GRADES, pwRules

### Community 9 - "Community 9"

Cohesion: 0.17
Nodes (13): DAY, DAY_MS, daysFromNow(), fmtDate(), fmtTime(), HOUR, HOUR_MS, initials() (+5 more)

### Community 10 - "Community 10"

Cohesion: 0.13
Nodes (11): DIFFICULTIES, lessonById, lessons, objectiveById, objectives, QUESTION_TYPES, stages, subjectById (+3 more)

### Community 11 - "Community 11"

Cohesion: 0.16
Nodes (11): GradingPage(), TeacherHome(), PerformancePage(), BlueprintModal(), GenerateModal(), KIND, ReviewPage(), commonGaps() (+3 more)

### Community 12 - "Community 12"

Cohesion: 0.25
Nodes (5): ToastCtx, Wordmark(), useLang(), LangSegmented(), LangToggle()

### Community 13 - "Community 13"

Cohesion: 0.25
Nodes (7): buildAttempt(), fmtClock(), LETTERS, QuizRunner(), ResultView(), levelLabel(), scoreAttempt()

### Community 14 - "Community 14"

Cohesion: 0.28
Nodes (7): Messages(), recipientsFor(), PrivacyPage(), childrenOf(), myAnnouncements(), myThreads(), unreadThreads()

### Community 15 - "Community 15"
_Unable to determine domain due to missing code entities._
Cohesion: 0.5
Nodes (0): 

### Community 16 - "Community 16"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **85 isolated node(s):** `PAGES`, `DEMO_PASSWORD`, `DEMO_CODE`, `GRADES`, `pwRules` (+80 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (2 nodes): `index.jsx`, `ParentPages()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `index.jsx`, `SchoolPages()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `index.jsx`, `StudentPages()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `index.jsx`, `SupervisorPages()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `index.jsx`, `SystemPages()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `index.jsx`, `TeacherPages()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `QuestionEditor.jsx`, `QuestionEditor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.