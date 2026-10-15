# مخطّط الكيانات والعلاقات (ERD) — قاعدة بيانات الـMVP

> مولَّد تلقائيًّا من [`schema.sql`](schema.sql) بعد تحميله في PostgreSQL فعلي، فكل جدول وعمود ومفتاح وعلاقة هنا هو ما في المخطّط حرفيًّا: **33 جدولًا و67 علاقة**. الشرح والقرارات في [`database.md`](database.md).
>
> **الملف الكامل في SVG واحد:** [`erd/mushriq-erd.svg`](erd/mushriq-erd.svg) (النظرة العامة + المخطّطات الستة، قابل للتكبير). ونسخة كل مخطّط على حدة (SVG وPNG) في [`erd/`](erd/)، و[`erd/full.svg`](erd/full.svg) فيه كل الجداول والعلاقات في رسمة واحدة غير مقسّمة.

**قراءة الرموز:** `PK` مفتاح أساسي · `FK` مفتاح أجنبي · `UK` قيمة فريدة · `nullable` يقبل الفراغ.
في مخطّطات المجالات: الخط `||--o{` يعني «واحد إلى كثير» والأصل إلزامي، و`|o--o{` يعني أن الأصل اختياري. الجداول التي تظهر بعمود `id` وحده تنتمي إلى مجال آخر وتظهر هنا لتوضيح العلاقة.

## الفهرس

1. [نظرة عامة](#نظرة-عامة)
2. [الهوية والصلاحيات](#الهوية-والصلاحيات)
3. [المنهج والمحتوى والذكاء الاصطناعي](#المنهج-والمحتوى-والذكاء-الاصطناعي)
4. [بنك الأسئلة والاختبارات](#بنك-الأسئلة-والاختبارات)
5. [التقدّم والإتقان والخطة العلاجية](#التقدّم-والإتقان-والخطة-العلاجية)
6. [الفصول واعتماد المعلّم والحضور](#الفصول-واعتماد-المعلّم-والحضور)
7. [الإشعارات والامتثال](#الإشعارات-والامتثال)

## نظرة عامة

الجداول مجمّعة حسب المجال، والسهم من الجدول الأصل إلى الجدول الذي يحمل المفتاح الأجنبي (المتقطّع = علاقة اختيارية). أعمدة «من نفّذ» مثل `created_by` و`decided_by` محذوفة من هذه النظرة لتبقى مقروءة، وهي ظاهرة في مخطّطات المجالات.

![نظرة عامة](erd/overview.png)

<details>
<summary>شيفرة Mermaid</summary>

```mermaid
flowchart LR
  subgraph g_identity["الهوية والصلاحيات"]
    direction TB
    organizations["organizations"]
    users["users"]
    parent_student_links["parent_student_links"]
    consents["consents"]
    auth_otp_codes["auth_otp_codes"]
    auth_sessions["auth_sessions"]
  end
  subgraph g_curriculum["المنهج والمحتوى والذكاء الاصطناعي"]
    direction TB
    stages["stages"]
    grades["grades"]
    subjects["subjects"]
    units["units"]
    lessons["lessons"]
    objectives["objectives"]
    lesson_content_versions["lesson_content_versions"]
    ai_jobs["ai_jobs"]
  end
  subgraph g_assessment["بنك الأسئلة والاختبارات"]
    direction TB
    questions["questions"]
    assessments["assessments"]
    assessment_questions["assessment_questions"]
    attempts["attempts"]
    attempt_answers["attempt_answers"]
  end
  subgraph g_progress["التقدّم والإتقان والخطة العلاجية"]
    direction TB
    lesson_progress["lesson_progress"]
    objective_mastery["objective_mastery"]
    mastery_events["mastery_events"]
    remedial_plans["remedial_plans"]
  end
  subgraph g_classes["الفصول واعتماد المعلّم والحضور"]
    direction TB
    classes["classes"]
    class_teachers["class_teachers"]
    class_students["class_students"]
    review_tasks["review_tasks"]
    attendance_records["attendance_records"]
  end
  subgraph g_ops["الإشعارات والامتثال"]
    direction TB
    notifications["notifications"]
    push_subscriptions["push_subscriptions"]
    audit_log["audit_log"]
    data_requests["data_requests"]
    leads["leads"]
  end
  organizations --> users
  users --> parent_student_links
  parent_student_links --> consents
  users --> auth_sessions
  stages --> grades
  grades --> subjects
  organizations -.-> units
  subjects --> units
  organizations -.-> lessons
  lesson_content_versions -.-> lessons
  units --> lessons
  lessons -.-> objectives
  units --> objectives
  ai_jobs -.-> lesson_content_versions
  lessons --> lesson_content_versions
  lessons -.-> ai_jobs
  ai_jobs -.-> questions
  lessons --> questions
  objectives --> questions
  lessons -.-> assessments
  units -.-> assessments
  assessments --> assessment_questions
  questions --> assessment_questions
  assessments --> attempts
  users --> attempts
  attempts --> attempt_answers
  questions --> attempt_answers
  lessons --> lesson_progress
  users --> lesson_progress
  objectives --> objective_mastery
  users --> objective_mastery
  attempts -.-> mastery_events
  objectives --> mastery_events
  users --> mastery_events
  objectives --> remedial_plans
  attempts -.-> remedial_plans
  users --> remedial_plans
  grades --> classes
  organizations --> classes
  classes --> class_teachers
  subjects --> class_teachers
  users --> class_teachers
  classes --> class_students
  users --> class_students
  assessments -.-> review_tasks
  lesson_content_versions -.-> review_tasks
  lessons -.-> review_tasks
  questions -.-> review_tasks
  users --> notifications
  users --> push_subscriptions
  organizations -.-> audit_log
  users --> data_requests
  classes --> attendance_records
  users --> attendance_records
  classDef default fill:#f0f6fb,stroke:#004f87,color:#0f2b46,font-size:13px
  style g_identity fill:#fff8e6,stroke:#c4daea,color:#0f2b46
  style g_curriculum fill:#effaf8,stroke:#c4daea,color:#0f2b46
  style g_assessment fill:#f0f6fb,stroke:#c4daea,color:#0f2b46
  style g_progress fill:#fff8e6,stroke:#c4daea,color:#0f2b46
  style g_classes fill:#effaf8,stroke:#c4daea,color:#0f2b46
  style g_ops fill:#f7fafc,stroke:#c4daea,color:#0f2b46
```

</details>

## الهوية والصلاحيات

الجداول: `organizations`، `users`، `parent_student_links`، `consents`، `auth_otp_codes`، `auth_sessions`.

```mermaid
erDiagram
  organizations {
    uuid id PK
    text type
    text name
    text city "nullable"
    text status
    timestamptz created_at
  }
  users {
    uuid id PK
    uuid org_id FK
    text role
    text full_name
    text phone UK "nullable"
    text email "nullable"
    text username UK "nullable"
    text password_hash "nullable"
    date birth_date "nullable"
    text status
    text locale
    timestamptz last_login_at "nullable"
    timestamptz deleted_at "nullable"
    timestamptz created_at
    timestamptz updated_at
  }
  parent_student_links {
    uuid parent_id PK, FK
    text parent_role
    uuid student_id PK, FK
    text student_role
    text relation
    timestamptz created_at
    timestamptz verified_at "nullable"
    timestamptz ended_at "nullable"
  }
  consents {
    uuid id PK
    uuid student_id
    uuid parent_id FK
    text kind
    boolean granted
    text policy_version
    timestamptz created_at
  }
  auth_otp_codes {
    uuid id PK
    text phone
    text code_hash
    text purpose
    smallint attempts
    timestamptz expires_at
    timestamptz consumed_at "nullable"
    timestamptz created_at
  }
  auth_sessions {
    uuid id PK
    uuid user_id FK
    text refresh_token_hash UK
    text user_agent "nullable"
    inet ip "nullable"
    timestamptz created_at
    timestamptz expires_at
    timestamptz revoked_at "nullable"
  }
  organizations ||--o{ users : "org_id"
  users ||--o{ parent_student_links : "parent_id"
  users ||--o{ parent_student_links : "student_id"
  parent_student_links ||--o{ consents : "parent_id"
  users ||--o{ auth_sessions : "user_id"
```

[صورة SVG](erd/identity.svg) · [صورة PNG](erd/identity.png)

## المنهج والمحتوى والذكاء الاصطناعي

الجداول: `stages`، `grades`، `subjects`، `units`، `lessons`، `objectives`، `lesson_content_versions`، `ai_jobs`. من مجالات أخرى: `organizations`، `users`.

```mermaid
erDiagram
  stages {
    uuid id PK
    text code UK
    text name
    smallint position
  }
  grades {
    uuid id PK
    uuid stage_id FK
    text code UK
    text name
    smallint position
  }
  subjects {
    uuid id PK
    uuid grade_id FK
    text code UK
    text name
    text tone
  }
  units {
    uuid id PK
    uuid subject_id FK
    uuid org_id FK "nullable"
    smallint no
    text title
  }
  lessons {
    uuid id PK
    uuid unit_id FK
    uuid org_id FK "nullable"
    smallint no
    text title
    smallint duration_min
    text status
    uuid published_content_id FK "nullable"
    boolean explain_enabled
    timestamptz created_at
    timestamptz updated_at
  }
  objectives {
    uuid id PK
    uuid unit_id FK
    uuid lesson_id FK "nullable"
    text code UK
    text title
  }
  lesson_content_versions {
    uuid id PK
    uuid lesson_id FK
    integer version
    jsonb explain
    jsonb examples
    jsonb summary
    jsonb cards
    text source
    uuid ai_job_id FK "nullable"
    text status
    uuid created_by FK "nullable"
    timestamptz created_at
    uuid decided_by FK "nullable"
    timestamptz decided_at "nullable"
  }
  ai_jobs {
    uuid id PK
    text kind
    uuid lesson_id FK "nullable"
    uuid requested_by FK "nullable"
    text model
    text prompt_version
    text status
    integer input_tokens "nullable"
    integer output_tokens "nullable"
    numeric cost_usd "nullable"
    text error "nullable"
    timestamptz created_at
    timestamptz started_at "nullable"
    timestamptz finished_at "nullable"
  }
  organizations {
    uuid id PK
  }
  users {
    uuid id PK
  }
  stages ||--o{ grades : "stage_id"
  grades ||--o{ subjects : "grade_id"
  organizations |o--o{ units : "org_id"
  subjects ||--o{ units : "subject_id"
  organizations |o--o{ lessons : "org_id"
  lesson_content_versions |o--o{ lessons : "published_content_id"
  units ||--o{ lessons : "unit_id"
  lessons |o--o{ objectives : "lesson_id"
  units ||--o{ objectives : "unit_id"
  ai_jobs |o--o{ lesson_content_versions : "ai_job_id"
  users |o--o{ lesson_content_versions : "created_by"
  users |o--o{ lesson_content_versions : "decided_by"
  lessons ||--o{ lesson_content_versions : "lesson_id"
  lessons |o--o{ ai_jobs : "lesson_id"
  users |o--o{ ai_jobs : "requested_by"
```

[صورة SVG](erd/curriculum.svg) · [صورة PNG](erd/curriculum.png)

## بنك الأسئلة والاختبارات

الجداول: `questions`، `assessments`، `assessment_questions`، `attempts`، `attempt_answers`. من مجالات أخرى: `ai_jobs`، `users`، `lessons`، `objectives`، `units`.

```mermaid
erDiagram
  questions {
    uuid id PK
    uuid lesson_id FK
    uuid objective_id FK
    text type
    text difficulty
    text stem
    jsonb payload
    text explanation
    text source
    uuid ai_job_id FK "nullable"
    text status
    uuid replaces_id FK "nullable"
    uuid created_by FK "nullable"
    uuid decided_by FK "nullable"
    timestamptz decided_at "nullable"
    timestamptz created_at
    timestamptz updated_at
  }
  assessments {
    uuid id PK
    text kind
    uuid lesson_id FK "nullable"
    uuid unit_id FK "nullable"
    text title
    text status
    smallint attempts_allowed "nullable"
    smallint duration_min "nullable"
    timestamptz created_at
    uuid decided_by FK "nullable"
    timestamptz decided_at "nullable"
  }
  assessment_questions {
    uuid assessment_id PK, FK
    uuid question_id PK, FK
    smallint position
    numeric points
  }
  attempts {
    uuid id PK
    uuid student_id FK
    text student_role
    uuid assessment_id FK
    text status
    timestamptz started_at
    timestamptz submitted_at "nullable"
    integer duration_sec "nullable"
    numeric earned_points "nullable"
    numeric max_points "nullable"
    numeric score "nullable"
    text client_id "nullable"
  }
  attempt_answers {
    uuid attempt_id PK, FK
    uuid question_id PK, FK
    jsonb answer "nullable"
    boolean is_correct "nullable"
    numeric points
  }
  ai_jobs {
    uuid id PK
  }
  users {
    uuid id PK
  }
  lessons {
    uuid id PK
  }
  objectives {
    uuid id PK
  }
  units {
    uuid id PK
  }
  ai_jobs |o--o{ questions : "ai_job_id"
  users |o--o{ questions : "created_by"
  users |o--o{ questions : "decided_by"
  lessons ||--o{ questions : "lesson_id"
  objectives ||--o{ questions : "objective_id"
  questions |o--o{ questions : "replaces_id"
  users |o--o{ assessments : "decided_by"
  lessons |o--o{ assessments : "lesson_id"
  units |o--o{ assessments : "unit_id"
  assessments ||--o{ assessment_questions : "assessment_id"
  questions ||--o{ assessment_questions : "question_id"
  assessments ||--o{ attempts : "assessment_id"
  users ||--o{ attempts : "student_id"
  attempts ||--o{ attempt_answers : "attempt_id"
  questions ||--o{ attempt_answers : "question_id"
```

[صورة SVG](erd/assessment.svg) · [صورة PNG](erd/assessment.png)

## التقدّم والإتقان والخطة العلاجية

الجداول: `lesson_progress`، `objective_mastery`، `mastery_events`، `remedial_plans`. من مجالات أخرى: `lessons`، `users`، `objectives`، `attempts`.

```mermaid
erDiagram
  lesson_progress {
    uuid student_id PK, FK
    uuid lesson_id PK, FK
    text status
    text last_level "nullable"
    numeric best_score "nullable"
    timestamptz started_at
    timestamptz completed_at "nullable"
  }
  objective_mastery {
    uuid student_id PK, FK
    uuid objective_id PK, FK
    smallint mastery
    integer attempts_count
    timestamptz updated_at
  }
  mastery_events {
    bigint id PK
    uuid student_id FK
    uuid objective_id FK
    uuid attempt_id FK "nullable"
    smallint before "nullable"
    smallint after
    timestamptz at
  }
  remedial_plans {
    uuid id PK
    uuid student_id FK
    uuid objective_id FK
    timestamptz opened_at
    timestamptz reexplain_done_at "nullable"
    timestamptz practice_done_at "nullable"
    uuid retest_attempt_id FK "nullable"
    timestamptz closed_at "nullable"
    text close_reason "nullable"
  }
  lessons {
    uuid id PK
  }
  users {
    uuid id PK
  }
  objectives {
    uuid id PK
  }
  attempts {
    uuid id PK
  }
  lessons ||--o{ lesson_progress : "lesson_id"
  users ||--o{ lesson_progress : "student_id"
  objectives ||--o{ objective_mastery : "objective_id"
  users ||--o{ objective_mastery : "student_id"
  attempts |o--o{ mastery_events : "attempt_id"
  objectives ||--o{ mastery_events : "objective_id"
  users ||--o{ mastery_events : "student_id"
  objectives ||--o{ remedial_plans : "objective_id"
  attempts |o--o{ remedial_plans : "retest_attempt_id"
  users ||--o{ remedial_plans : "student_id"
```

[صورة SVG](erd/progress.svg) · [صورة PNG](erd/progress.png)

## الفصول واعتماد المعلّم والحضور

الجداول: `classes`، `class_teachers`، `class_students`، `review_tasks`، `attendance_records`. من مجالات أخرى: `grades`، `organizations`، `subjects`، `users`، `assessments`، `lesson_content_versions`، `lessons`، `questions`.

```mermaid
erDiagram
  classes {
    uuid id PK
    uuid org_id FK
    uuid grade_id FK
    text name
    text academic_year
    timestamptz created_at
  }
  class_teachers {
    uuid class_id PK, FK
    uuid teacher_id PK, FK
    text teacher_role
    uuid subject_id PK, FK
  }
  class_students {
    uuid class_id PK, FK
    uuid student_id PK, FK
    text student_role
    timestamptz joined_at
    timestamptz left_at "nullable"
  }
  review_tasks {
    uuid id PK
    text kind
    uuid lesson_content_id FK "nullable"
    uuid assessment_id FK "nullable"
    uuid question_id FK "nullable"
    uuid lesson_id FK "nullable"
    text title
    text status
    text note "nullable"
    uuid assigned_to FK "nullable"
    timestamptz requested_at
    uuid decided_by FK "nullable"
    timestamptz decided_at "nullable"
  }
  attendance_records {
    uuid class_id PK, FK
    uuid student_id PK, FK
    date day PK
    text status
    uuid recorded_by FK
    timestamptz recorded_at
  }
  grades {
    uuid id PK
  }
  organizations {
    uuid id PK
  }
  subjects {
    uuid id PK
  }
  users {
    uuid id PK
  }
  assessments {
    uuid id PK
  }
  lesson_content_versions {
    uuid id PK
  }
  lessons {
    uuid id PK
  }
  questions {
    uuid id PK
  }
  grades ||--o{ classes : "grade_id"
  organizations ||--o{ classes : "org_id"
  classes ||--o{ class_teachers : "class_id"
  subjects ||--o{ class_teachers : "subject_id"
  users ||--o{ class_teachers : "teacher_id"
  classes ||--o{ class_students : "class_id"
  users ||--o{ class_students : "student_id"
  assessments |o--o{ review_tasks : "assessment_id"
  users |o--o{ review_tasks : "assigned_to"
  users |o--o{ review_tasks : "decided_by"
  lesson_content_versions |o--o{ review_tasks : "lesson_content_id"
  lessons |o--o{ review_tasks : "lesson_id"
  questions |o--o{ review_tasks : "question_id"
  classes ||--o{ attendance_records : "class_id"
  users ||--o{ attendance_records : "recorded_by"
  users ||--o{ attendance_records : "student_id"
```

[صورة SVG](erd/classes.svg) · [صورة PNG](erd/classes.png)

## الإشعارات والامتثال

الجداول: `notifications`، `push_subscriptions`، `audit_log`، `data_requests`، `leads`. من مجالات أخرى: `users`، `organizations`.

```mermaid
erDiagram
  notifications {
    uuid id PK
    uuid user_id FK
    text kind
    text title
    text body "nullable"
    text link "nullable"
    jsonb data
    timestamptz created_at
    timestamptz pushed_at "nullable"
    timestamptz read_at "nullable"
  }
  push_subscriptions {
    uuid id PK
    uuid user_id FK
    text endpoint UK
    text p256dh
    text auth
    text user_agent "nullable"
    timestamptz created_at
    timestamptz last_seen_at "nullable"
  }
  audit_log {
    bigint id PK
    timestamptz at
    uuid org_id FK "nullable"
    uuid actor_id FK "nullable"
    text actor_role "nullable"
    text action
    text entity_type
    text entity_id "nullable"
    inet ip "nullable"
    jsonb details
  }
  data_requests {
    uuid id PK
    uuid subject_id FK
    uuid requested_by FK
    text kind
    text status
    text note "nullable"
    timestamptz created_at
    timestamptz completed_at "nullable"
  }
  leads {
    uuid id PK
    text name
    text contact
    text org "nullable"
    text kind
    text message "nullable"
    text lang
    text status
    text ip_hash "nullable"
    timestamptz created_at
  }
  users {
    uuid id PK
  }
  organizations {
    uuid id PK
  }
  users ||--o{ notifications : "user_id"
  users ||--o{ push_subscriptions : "user_id"
  users |o--o{ audit_log : "actor_id"
  organizations |o--o{ audit_log : "org_id"
  users ||--o{ data_requests : "requested_by"
  users ||--o{ data_requests : "subject_id"
```

[صورة SVG](erd/ops.svg) · [صورة PNG](erd/ops.png)
