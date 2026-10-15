-- ============================================================================
-- مشرق — قاعدة بيانات الـMVP (PostgreSQL 15+)
-- التحليل والقرارات: docs/mvp/database.md
--
-- اصطلاحات:
-- • جداول بصيغة الجمع snake_case (تطابق اصطلاحات Laravel / أي ORM).
-- • المفاتيح uuid، والوقت timestamptz.
-- • القيم المحدودة نصّ + CHECK بدل ENUM: أسهل في الإضافة لاحقًا دون ترحيل نوع.
-- • org_id موجود من اليوم الأول (مستأجر واحد في الـMVP) حتى لا نعيد هيكلة البيانات عند المدارس.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- تحديث updated_at تلقائيًّا
CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- ============================================================================
-- ١. الجهات والهوية والصلاحيات
-- ============================================================================

-- الجهة المالكة للبيانات: «مشرق» نفسها للأفراد (B2C)، ومدرسة لاحقًا (B2B)
CREATE TABLE organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('platform', 'school')),
  name        text NOT NULL,
  city        text,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations (id),
  role           text NOT NULL CHECK (role IN ('student', 'parent', 'teacher', 'admin')),
  full_name      text NOT NULL,
  -- وسيلة دخول واحدة على الأقل: وليّ الأمر والمعلّم بالجوال، والطالب القاصر غالبًا باسم مستخدم ينشئه وليّ أمره
  phone          text UNIQUE CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'), -- E.164
  email          text,
  username       text UNIQUE,
  password_hash  text,
  birth_date     date,                -- لتحديد القاصر (موافقة وليّ الأمر شرط لتفعيله)
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  locale         text NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (phone IS NOT NULL OR email IS NOT NULL OR username IS NOT NULL),
  UNIQUE (id, role) -- يسمح للجداول الأخرى بأن تشترط الدور في المفتاح الأجنبي نفسه
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX users_org_role ON users (org_id, role);
CREATE TRIGGER users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- وليّ الأمر ↔ أبناؤه (متعدد إلى متعدد). الدور مضمون في القاعدة عبر (id, role)
CREATE TABLE parent_student_links (
  parent_id     uuid NOT NULL,
  parent_role   text NOT NULL DEFAULT 'parent' CHECK (parent_role = 'parent'),
  student_id    uuid NOT NULL,
  student_role  text NOT NULL DEFAULT 'student' CHECK (student_role = 'student'),
  relation      text NOT NULL CHECK (relation IN ('father', 'mother', 'guardian')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  verified_at   timestamptz,
  PRIMARY KEY (parent_id, student_id),
  FOREIGN KEY (parent_id, parent_role) REFERENCES users (id, role) ON DELETE CASCADE,
  FOREIGN KEY (student_id, student_role) REFERENCES users (id, role) ON DELETE CASCADE
);
CREATE INDEX parent_links_student ON parent_student_links (student_id);

-- الموافقات: سجلّ إلحاقي (لا تعديل). الحالة الحالية = آخر صفّ لكل (طالب، نوع)
CREATE TABLE consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  parent_id       uuid NOT NULL,
  parent_role     text NOT NULL DEFAULT 'parent' CHECK (parent_role = 'parent'),
  kind            text NOT NULL CHECK (kind IN ('terms', 'data_processing', 'media', 'notifications')),
  granted         boolean NOT NULL,
  policy_version  text NOT NULL, -- نسخة سياسة الخصوصية/الشروط التي وافق عليها
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (parent_id, parent_role) REFERENCES users (id, role)
);
CREATE INDEX consents_lookup ON consents (student_id, kind, created_at DESC);

CREATE VIEW current_consents AS
  SELECT DISTINCT ON (student_id, kind) student_id, kind, granted, policy_version, parent_id, created_at
  FROM consents
  ORDER BY student_id, kind, created_at DESC;

-- رموز التحقق بالجوال (إن لم نستخدم مزوّدًا خارجيًّا). الرمز مخزَّن مُجزّأ (hash) لا نصًّا
CREATE TABLE auth_otp_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        text NOT NULL,
  code_hash    text NOT NULL,
  purpose      text NOT NULL CHECK (purpose IN ('login', 'signup', 'reset')),
  attempts     smallint NOT NULL DEFAULT 0 CHECK (attempts <= 5), -- حدّ خمس محاولات
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_phone_recent ON auth_otp_codes (phone, created_at DESC);

CREATE TABLE auth_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  refresh_token_hash  text NOT NULL UNIQUE,
  user_agent          text,
  ip                  inet,
  created_at          timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz NOT NULL,
  revoked_at          timestamptz
);
CREATE INDEX sessions_user_active ON auth_sessions (user_id) WHERE revoked_at IS NULL;

-- ============================================================================
-- ٢. المنهج والمحتوى (F1.1، F1.2، F1.3، F1.4)
-- ============================================================================

CREATE TABLE stages (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code      text NOT NULL UNIQUE,           -- primary | inter | secondary
  name      text NOT NULL,
  position  smallint NOT NULL
);

CREATE TABLE grades (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id  uuid NOT NULL REFERENCES stages (id),
  code      text NOT NULL UNIQUE,           -- i-الثالث …
  name      text NOT NULL,
  position  smallint NOT NULL
);

CREATE TABLE subjects (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id  uuid NOT NULL REFERENCES grades (id),
  code      text NOT NULL UNIQUE,           -- S-MATH …
  name      text NOT NULL,
  tone      text NOT NULL DEFAULT 'other'   -- لون المادة في الواجهة
);

CREATE TABLE units (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL REFERENCES subjects (id),
  no          smallint NOT NULL,
  title       text NOT NULL,
  UNIQUE (subject_id, no)
);

CREATE TABLE lessons (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id               uuid NOT NULL REFERENCES units (id),
  no                    smallint NOT NULL,
  title                 text NOT NULL,
  duration_min          smallint NOT NULL DEFAULT 15,
  -- لا يظهر للطالب إلا published، ولا يُنشر إلا بنسخة محتوى معتمدة
  status                text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'archived')),
  published_content_id  uuid, -- FK أدناه (بعد إنشاء lesson_content_versions)
  explain_enabled       boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unit_id, no),
  CHECK (status <> 'published' OR published_content_id IS NOT NULL)
);
CREATE TRIGGER lessons_updated BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- أهداف التعلّم: وحدة القياس للإتقان والفجوات
CREATE TABLE objectives (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id    uuid NOT NULL REFERENCES units (id),
  lesson_id  uuid REFERENCES lessons (id),
  code       text NOT NULL UNIQUE,   -- O-M2 …
  title      text NOT NULL
);
CREATE INDEX objectives_lesson ON objectives (lesson_id);

-- نسخ محتوى الدرس (شرح بثلاثة مستويات، أمثلة، ملخّص، مصطلحات، بطاقات).
-- كل توليد أو تعديل = نسخة جديدة تمرّ على اعتماد المعلّم؛ الدرس يشير إلى النسخة المنشورة.
CREATE TABLE lesson_content_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  version      integer NOT NULL,
  explain      jsonb NOT NULL,         -- {"base":[{h,p}], "medium":[…], "deep":[…]}
  examples     jsonb NOT NULL DEFAULT '[]',
  summary      jsonb NOT NULL,         -- {"points":[…], "terms":[[term, meaning]]}
  cards        jsonb NOT NULL DEFAULT '[]',
  source       text NOT NULL CHECK (source IN ('ai', 'teacher', 'import')),
  ai_job_id    uuid,                   -- FK أدناه
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'superseded')),
  created_by   uuid REFERENCES users (id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  decided_by   uuid REFERENCES users (id),
  decided_at   timestamptz,
  UNIQUE (lesson_id, version),
  CHECK (jsonb_typeof(explain) = 'object' AND explain ? 'base'),
  CHECK ((status IN ('approved', 'rejected')) = (decided_at IS NOT NULL))
);

ALTER TABLE lessons
  ADD CONSTRAINT lessons_published_content_fk
  FOREIGN KEY (published_content_id) REFERENCES lesson_content_versions (id);

-- ============================================================================
-- ٣. «النجمة»: مهام الذكاء الاصطناعي وحوكمة الكلفة
-- ============================================================================

CREATE TABLE ai_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            text NOT NULL CHECK (kind IN ('explain', 'summary', 'questions', 'regenerate')),
  lesson_id       uuid REFERENCES lessons (id),
  requested_by    uuid REFERENCES users (id),
  model           text NOT NULL,
  prompt_version  text NOT NULL,     -- لتتبّع أثر تغيير الموجّهات على الجودة
  status          text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  input_tokens    integer,
  output_tokens   integer,
  cost_usd        numeric(10, 4),
  error           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz,
  finished_at     timestamptz
);
CREATE INDEX ai_jobs_created ON ai_jobs (created_at);
CREATE INDEX ai_jobs_open ON ai_jobs (status) WHERE status IN ('queued', 'running');

ALTER TABLE lesson_content_versions
  ADD CONSTRAINT content_ai_job_fk FOREIGN KEY (ai_job_id) REFERENCES ai_jobs (id);

-- ============================================================================
-- ٤. بنك الأسئلة والاختبارات والمحاولات (F2.1، F2.3، F2.4)
-- ============================================================================

CREATE TABLE questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     uuid NOT NULL REFERENCES lessons (id),
  objective_id  uuid NOT NULL REFERENCES objectives (id),
  -- المقالي (essay) مع معايير التصحيح يُضاف في المرحلة ٢
  type          text NOT NULL CHECK (type IN ('mcq', 'tf', 'fill', 'match')),
  difficulty    text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  stem          text NOT NULL,
  -- mcq: {"options":[…], "answer":1} · tf: {"answer":true} · fill: {"answers":["…"]} · match: {"pairs":[[a,b]]}
  payload       jsonb NOT NULL,
  explanation   text NOT NULL,       -- «لماذا» تُعرض بعد الإجابة
  source        text NOT NULL CHECK (source IN ('ai', 'teacher', 'import')),
  ai_job_id     uuid REFERENCES ai_jobs (id),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'retired')),
  version       integer NOT NULL DEFAULT 1,
  created_by    uuid REFERENCES users (id),
  decided_by    uuid REFERENCES users (id),
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(payload) = 'object')
);
CREATE INDEX questions_lesson_status ON questions (lesson_id, status);
CREATE INDEX questions_objective ON questions (objective_id);
CREATE TRIGGER questions_updated BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- مجموعة أسئلة يعتمدها المعلّم كاختبار درس (وامتحان وحدة في المرحلة ٢)
CREATE TABLE assessments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind              text NOT NULL CHECK (kind IN ('lesson_quiz', 'unit_exam')),
  lesson_id         uuid REFERENCES lessons (id),
  unit_id           uuid REFERENCES units (id),
  title             text NOT NULL,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  attempts_allowed  smallint,           -- NULL = غير محدود
  duration_min      smallint,
  created_at        timestamptz NOT NULL DEFAULT now(),
  decided_by        uuid REFERENCES users (id),
  decided_at        timestamptz,
  CHECK ((kind = 'lesson_quiz' AND lesson_id IS NOT NULL) OR (kind = 'unit_exam' AND unit_id IS NOT NULL))
);
-- اختبار معتمد واحد فقط لكل درس في الوقت نفسه
CREATE UNIQUE INDEX one_live_quiz_per_lesson ON assessments (lesson_id) WHERE kind = 'lesson_quiz' AND status = 'approved';

CREATE TABLE assessment_questions (
  assessment_id  uuid NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
  question_id    uuid NOT NULL REFERENCES questions (id),
  position       smallint NOT NULL,
  points         numeric(5, 2) NOT NULL DEFAULT 1 CHECK (points > 0),
  PRIMARY KEY (assessment_id, question_id),
  UNIQUE (assessment_id, position)
);

CREATE TABLE attempts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL,
  student_role   text NOT NULL DEFAULT 'student' CHECK (student_role = 'student'),
  assessment_id  uuid NOT NULL REFERENCES assessments (id),
  status         text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
  started_at     timestamptz NOT NULL DEFAULT now(),
  submitted_at   timestamptz,
  duration_sec   integer CHECK (duration_sec >= 0),
  earned_points  numeric(7, 2),
  max_points     numeric(7, 2),
  score          numeric(5, 2) CHECK (score BETWEEN 0 AND 100),
  -- معرّف يولّده الجهاز: يمنع تكرار المحاولة عند إعادة الإرسال بعد انقطاع الاتصال (PWA)
  client_id      text,
  FOREIGN KEY (student_id, student_role) REFERENCES users (id, role),
  CHECK ((status = 'submitted') = (submitted_at IS NOT NULL AND score IS NOT NULL)),
  UNIQUE (student_id, client_id)
);
CREATE INDEX attempts_student_recent ON attempts (student_id, submitted_at DESC);
CREATE INDEX attempts_assessment ON attempts (assessment_id);

CREATE TABLE attempt_answers (
  attempt_id        uuid NOT NULL REFERENCES attempts (id) ON DELETE CASCADE,
  question_id       uuid NOT NULL REFERENCES questions (id),
  question_version  integer NOT NULL, -- التصحيح يبقى صحيحًا ولو عُدّل السؤال لاحقًا
  answer            jsonb,
  is_correct        boolean,
  points            numeric(5, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id)
);
CREATE INDEX answers_question ON attempt_answers (question_id); -- إحصاءات صعوبة السؤال

-- ============================================================================
-- ٥. التقدّم والإتقان والخطة العلاجية (F4.2، و F3.4/F3.2 بنسخة مبسّطة)
-- ============================================================================

CREATE TABLE lesson_progress (
  student_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id     uuid NOT NULL REFERENCES lessons (id),
  status        text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  last_level    text CHECK (last_level IN ('simple', 'medium', 'deep')),
  best_score    numeric(5, 2) CHECK (best_score BETWEEN 0 AND 100),
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  PRIMARY KEY (student_id, lesson_id)
);

-- القيمة الحالية لإتقان كل هدف (0–100). الفجوة = أقل من 70، والإغلاق عند 80 فأكثر
CREATE TABLE objective_mastery (
  student_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  objective_id    uuid NOT NULL REFERENCES objectives (id),
  mastery         smallint NOT NULL CHECK (mastery BETWEEN 0 AND 100),
  attempts_count  integer NOT NULL DEFAULT 1,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, objective_id)
);
CREATE INDEX mastery_gaps ON objective_mastery (student_id) WHERE mastery < 70;

-- تاريخ تغيّر الإتقان (لرسم التقدّم ولتفسير أي رقم يراه وليّ الأمر)
CREATE TABLE mastery_events (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  objective_id  uuid NOT NULL REFERENCES objectives (id),
  attempt_id    uuid REFERENCES attempts (id) ON DELETE SET NULL,
  before        smallint CHECK (before BETWEEN 0 AND 100),
  after         smallint NOT NULL CHECK (after BETWEEN 0 AND 100),
  at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mastery_events_timeline ON mastery_events (student_id, objective_id, at);

-- خطة علاجية: إعادة شرح ← تمارين ← إعادة اختبار. خطة مفتوحة واحدة لكل (طالب، هدف)
CREATE TABLE remedial_plans (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  objective_id       uuid NOT NULL REFERENCES objectives (id),
  opened_at          timestamptz NOT NULL DEFAULT now(),
  reexplain_done_at  timestamptz,
  practice_done_at   timestamptz,
  retest_attempt_id  uuid REFERENCES attempts (id),
  closed_at          timestamptz,
  close_reason       text CHECK (close_reason IN ('mastered', 'manual')),
  CHECK ((closed_at IS NULL) = (close_reason IS NULL))
);
CREATE UNIQUE INDEX one_open_plan ON remedial_plans (student_id, objective_id) WHERE closed_at IS NULL;

-- ============================================================================
-- ٦. الفصول (F6.1) واعتماد المعلّم (F6.2)
-- ============================================================================

CREATE TABLE classes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations (id),
  grade_id       uuid NOT NULL REFERENCES grades (id),
  name           text NOT NULL,
  academic_year  text NOT NULL,       -- 1447-1448 …
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, academic_year, name)
);

CREATE TABLE class_teachers (
  class_id      uuid NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  teacher_id    uuid NOT NULL,
  teacher_role  text NOT NULL DEFAULT 'teacher' CHECK (teacher_role = 'teacher'),
  subject_id    uuid NOT NULL REFERENCES subjects (id),
  PRIMARY KEY (class_id, teacher_id, subject_id),
  FOREIGN KEY (teacher_id, teacher_role) REFERENCES users (id, role)
);
CREATE INDEX class_teachers_teacher ON class_teachers (teacher_id);

CREATE TABLE class_students (
  class_id      uuid NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  student_id    uuid NOT NULL,
  student_role  text NOT NULL DEFAULT 'student' CHECK (student_role = 'student'),
  joined_at     timestamptz NOT NULL DEFAULT now(),
  left_at       timestamptz,
  PRIMARY KEY (class_id, student_id),
  FOREIGN KEY (student_id, student_role) REFERENCES users (id, role)
);
CREATE INDEX class_students_student ON class_students (student_id);

-- طابور «لا يصل شيء للطالب قبل اعتماد المعلّم». هدف واحد فقط لكل مهمّة
CREATE TABLE review_tasks (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind               text NOT NULL CHECK (kind IN ('lesson_content', 'assessment', 'question')),
  lesson_content_id  uuid REFERENCES lesson_content_versions (id) ON DELETE CASCADE,
  assessment_id      uuid REFERENCES assessments (id) ON DELETE CASCADE,
  question_id        uuid REFERENCES questions (id) ON DELETE CASCADE,
  lesson_id          uuid REFERENCES lessons (id),  -- للتصفية والعرض
  title              text NOT NULL,
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  note               text,
  assigned_to        uuid REFERENCES users (id),
  requested_at       timestamptz NOT NULL DEFAULT now(),
  decided_by         uuid REFERENCES users (id),
  decided_at         timestamptz,
  CHECK (num_nonnulls(lesson_content_id, assessment_id, question_id) = 1),
  CHECK ((status = 'pending') = (decided_at IS NULL))
);
CREATE INDEX review_queue ON review_tasks (assigned_to, requested_at) WHERE status = 'pending';

-- ============================================================================
-- ٧. الإشعارات (F5.2) ودفع PWA
-- ============================================================================

CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind        text NOT NULL,   -- lesson_done, gap_found, plan_closed, review_needed, weekly_report …
  title       text NOT NULL,
  body        text,
  link        text,            -- مسار داخل التطبيق
  data        jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  pushed_at   timestamptz,
  read_at     timestamptz
);
CREATE INDEX notifications_feed ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread ON notifications (user_id) WHERE read_at IS NULL;

CREATE TABLE push_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  endpoint      text NOT NULL UNIQUE,
  p256dh        text NOT NULL,
  auth          text NOT NULL,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz
);

-- ============================================================================
-- ٨. الامتثال: سجلّ التدقيق وطلبات البيانات وطلبات التواصل
-- ============================================================================

CREATE TABLE audit_log (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at           timestamptz NOT NULL DEFAULT now(),
  org_id       uuid REFERENCES organizations (id),
  actor_id     uuid REFERENCES users (id) ON DELETE SET NULL,
  actor_role   text,
  action       text NOT NULL,   -- content.approve, question.reject, consent.revoke, user.suspend …
  entity_type  text NOT NULL,
  entity_id    text,
  ip           inet,
  details      jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX audit_entity ON audit_log (entity_type, entity_id);
CREATE INDEX audit_actor ON audit_log (actor_id, at DESC);

-- سجلّ إلحاقي: لا تعديل ولا حذف
CREATE FUNCTION audit_log_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END $$;
CREATE TRIGGER audit_no_update BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();

-- طلبات أصحاب البيانات (نظام حماية البيانات الشخصية): تصدير، حذف، تصحيح
CREATE TABLE data_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    uuid NOT NULL REFERENCES users (id),   -- صاحب البيانات (قد يكون الطالب)
  requested_by  uuid NOT NULL REFERENCES users (id),   -- وليّ الأمر أو صاحب الحساب
  kind          text NOT NULL CHECK (kind IN ('export', 'delete', 'correct')),
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'rejected')),
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

CREATE TABLE leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  contact     text NOT NULL,
  org         text,
  kind        text NOT NULL,
  message     text,
  lang        text NOT NULL DEFAULT 'ar',
  status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  ip_hash     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ٩. اختياري: فقط إن بدأنا بمدرسة تجريبية (الحضور في الوثيقة مرحلة ٢)
-- ============================================================================

CREATE TABLE attendance_records (
  class_id     uuid NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  student_id   uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  day          date NOT NULL,
  status       text NOT NULL CHECK (status IN ('present', 'late', 'excused', 'absent')),
  recorded_by  uuid NOT NULL REFERENCES users (id),
  recorded_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id, day)
);
CREATE INDEX attendance_student_day ON attendance_records (student_id, day DESC);
