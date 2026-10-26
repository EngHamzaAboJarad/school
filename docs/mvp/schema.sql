-- ============================================================================
-- مشرق — قاعدة بيانات الـMVP (PostgreSQL 15+)
-- التحليل والقرارات: docs/mvp/database.md
--
-- اصطلاحات:
-- • جداول بصيغة الجمع snake_case. الخادم Node.js، وهذا الملف هو المصدر الوحيد للمخطّط (database.md §١٠).
-- • المفاتيح uuid، والوقت timestamptz.
-- • القيم المحدودة نصّ + CHECK بدل ENUM: أسهل في الإضافة لاحقًا دون ترحيل نوع.
-- • org_id موجود من اليوم الأول (مستأجر واحد في الـMVP) حتى لا نعيد هيكلة البيانات عند المدارس.
-- • كل مفتاح أجنبي مفهرس، إلا أعمدة «من نفّذ» (created_by، decided_by…): المستخدمون لا يُحذفون فلا مسح عليها.
-- • صفّ المستخدم لا يُحذف أبدًا: حق الحذف ينفَّذ بـ anonymize_user() (القسم ٨).
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
  -- deleted = بياناته الشخصية مُسحت (anonymize_user). لا يُحذف صفّ مستخدم أبدًا، انظر القسم ٨
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),
  locale         text NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  last_login_at  timestamptz,
  deleted_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (status = 'deleted' OR phone IS NOT NULL OR email IS NOT NULL OR username IS NOT NULL),
  CHECK ((status = 'deleted') = (deleted_at IS NOT NULL)),
  UNIQUE (id, role) -- يسمح للجداول الأخرى بأن تشترط الدور في المفتاح الأجنبي نفسه
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX users_org_role ON users (org_id, role);
CREATE TRIGGER users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- وليّ الأمر ↔ أبناؤه (متعدد إلى متعدد). الدور مضمون في القاعدة عبر (id, role).
-- الربط لا يُحذف (الموافقات تشير إليه)؛ إنهاؤه بـ ended_at عند تغيّر الولاية
CREATE TABLE parent_student_links (
  parent_id     uuid NOT NULL,
  parent_role   text NOT NULL DEFAULT 'parent' CHECK (parent_role = 'parent'),
  student_id    uuid NOT NULL,
  student_role  text NOT NULL DEFAULT 'student' CHECK (student_role = 'student'),
  relation      text NOT NULL CHECK (relation IN ('father', 'mother', 'guardian')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  verified_at   timestamptz,
  ended_at      timestamptz,
  PRIMARY KEY (parent_id, student_id),
  FOREIGN KEY (parent_id, parent_role) REFERENCES users (id, role),
  FOREIGN KEY (student_id, student_role) REFERENCES users (id, role)
);
CREATE INDEX parent_links_student ON parent_student_links (student_id);

-- الموافقات: سجلّ إلحاقي (لا تعديل). الحالة الحالية = آخر صفّ لكل (طالب، نوع).
-- المفتاح الأجنبي على جدول الربط نفسه: لا يوافق عن الطالب إلا وليّ أمر مربوط به
CREATE TABLE consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL,
  parent_id       uuid NOT NULL,
  kind            text NOT NULL CHECK (kind IN ('terms', 'data_processing', 'media', 'notifications')),
  granted         boolean NOT NULL,
  policy_version  text NOT NULL, -- نسخة سياسة الخصوصية/الشروط التي وافق عليها
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (parent_id, student_id) REFERENCES parent_student_links (parent_id, student_id)
);
CREATE INDEX consents_lookup ON consents (student_id, kind, created_at DESC);
CREATE INDEX consents_parent ON consents (parent_id);

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
CREATE INDEX grades_stage ON grades (stage_id);

CREATE TABLE subjects (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id  uuid NOT NULL REFERENCES grades (id),
  code      text NOT NULL UNIQUE,           -- S-MATH …
  name      text NOT NULL,
  tone      text NOT NULL DEFAULT 'other'   -- لون المادة في الواجهة
);
CREATE INDEX subjects_grade ON subjects (grade_id);

-- org_id في الوحدات والدروس: NULL = منهج «مشرق» المشترك يراه الجميع؛
-- قيمة = محتوى خاص أضافته جهة (مدرسة) لا يراه غيرها. الواجهة تعرض: org_id IS NULL OR org_id = جهة المستخدم
CREATE TABLE units (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL REFERENCES subjects (id),
  org_id      uuid REFERENCES organizations (id),
  no          smallint NOT NULL,
  title       text NOT NULL,
  UNIQUE (subject_id, no)
);
CREATE INDEX units_subject ON units (subject_id);
CREATE INDEX units_org ON units (org_id) WHERE org_id IS NOT NULL;

CREATE TABLE lessons (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id               uuid NOT NULL REFERENCES units (id),
  org_id                uuid REFERENCES organizations (id), -- درس في وحدة خاصة يحمل جهتها نفسها (trigger أدناه)
  no                    smallint NOT NULL,
  title                 text NOT NULL,
  duration_min          smallint NOT NULL DEFAULT 15,
  -- لا يظهر للطالب إلا published، ولا يُنشر إلا بنسخة محتوى معتمدة من الدرس نفسه
  status                text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'archived')),
  published_content_id  uuid, -- FK أدناه (بعد إنشاء lesson_content_versions)
  explain_enabled       boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unit_id, no),
  UNIQUE (id, unit_id), -- يسمح للأهداف بأن تشترط أن درسها من وحدتها
  CHECK (status <> 'published' OR published_content_id IS NOT NULL)
);
CREATE INDEX lessons_org ON lessons (org_id) WHERE org_id IS NOT NULL;
CREATE TRIGGER lessons_updated BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- أهداف التعلّم: وحدة القياس للإتقان والفجوات.
-- (lesson_id, unit_id) مفتاح أجنبي مركّب: هدف الدرس لا بد أن يكون في وحدة الدرس نفسها
CREATE TABLE objectives (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id    uuid NOT NULL REFERENCES units (id),
  lesson_id  uuid,
  code       text NOT NULL UNIQUE,   -- O-M2 …
  title      text NOT NULL,
  FOREIGN KEY (lesson_id, unit_id) REFERENCES lessons (id, unit_id)
);
CREATE INDEX objectives_lesson ON objectives (lesson_id);
CREATE INDEX objectives_unit ON objectives (unit_id);

-- نسخ محتوى الدرس (شرح بثلاثة مستويات، أمثلة، ملخّص، مصطلحات، بطاقات).
-- كل توليد أو تعديل = نسخة جديدة تمرّ على اعتماد المعلّم؛ الدرس يشير إلى النسخة المنشورة.
-- النسخة بعد القرار (اعتماد أو رفض) لا يُعدَّل محتواها أبدًا (trigger في القسم ٤-ب).
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
  UNIQUE (id, lesson_id), -- يسمح للدرس بأن يشترط أن نسخته المنشورة نسخته هو
  CHECK (jsonb_typeof(explain) = 'object' AND explain ? 'base'),
  -- superseded = كانت معتمدة ثم حلّت محلّها نسخة أحدث، فلها وقت قرار
  CHECK ((status = 'pending') = (decided_at IS NULL))
);
CREATE INDEX content_versions_ai_job ON lesson_content_versions (ai_job_id) WHERE ai_job_id IS NOT NULL;

-- النسخة المنشورة يجب أن تكون من الدرس نفسه (المفتاح المركّب) ومعتمدة (trigger في القسم ٤-ب)
ALTER TABLE lessons
  ADD CONSTRAINT lessons_published_content_fk
  FOREIGN KEY (published_content_id, id) REFERENCES lesson_content_versions (id, lesson_id);
CREATE INDEX lessons_published_content ON lessons (published_content_id) WHERE published_content_id IS NOT NULL;

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
CREATE INDEX ai_jobs_lesson ON ai_jobs (lesson_id);
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
  -- السؤال بعد القرار لا يُعدَّل: التعديل سؤال جديد يشير إلى ما يستبدله، والقديم يتقاعد (retired)
  replaces_id   uuid REFERENCES questions (id),
  created_by    uuid REFERENCES users (id),
  decided_by    uuid REFERENCES users (id),
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(payload) = 'object'),
  CHECK ((status = 'pending') = (decided_at IS NULL))
);
CREATE INDEX questions_lesson_status ON questions (lesson_id, status);
CREATE INDEX questions_objective ON questions (objective_id);
CREATE INDEX questions_ai_job ON questions (ai_job_id) WHERE ai_job_id IS NOT NULL;
CREATE INDEX questions_replaces ON questions (replaces_id) WHERE replaces_id IS NOT NULL;
CREATE TRIGGER questions_updated BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- مجموعة أسئلة يعتمدها المعلّم كاختبار درس (وامتحان وحدة في المرحلة ٢).
-- تُبنى وهي pending ثم تُعتمد؛ الاختبار المعتمد مُجمَّد (لا إضافة ولا حذف أسئلة) وكل أسئلته معتمدة
-- وكلها من درسه (أو من دروس وحدته لامتحان الوحدة). القواعد في القسم ٤-ب
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
  CHECK ((kind = 'lesson_quiz' AND lesson_id IS NOT NULL) OR (kind = 'unit_exam' AND unit_id IS NOT NULL)),
  CHECK ((status = 'pending') = (decided_at IS NULL))
);
CREATE INDEX assessments_lesson ON assessments (lesson_id);
CREATE INDEX assessments_unit ON assessments (unit_id) WHERE unit_id IS NOT NULL;
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
CREATE INDEX assessment_questions_question ON assessment_questions (question_id);

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
  question_id       uuid NOT NULL REFERENCES questions (id), -- السؤال لا يتغيّر بعد اعتماده، فالنصّ الذي أجاب عنه الطالب محفوظ
  answer            jsonb,
  is_correct        boolean,
  points            numeric(5, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id)
);
CREATE INDEX answers_question ON attempt_answers (question_id); -- إحصاءات صعوبة السؤال

-- ============================================================================
-- ٤-ب. قواعد السلامة عبر الجداول
-- «لا يصل شيء للطالب قبل اعتماد المعلّم» و«ما اعتُمد لا يتغيّر» تفرضهما القاعدة نفسها،
-- لا الخادم وحده، فلا يكسرهما خطأ برمجي أو استعلام يدوي.
-- ============================================================================

-- الدرس: نسخته المنشورة معتمدة، ودرس الوحدة الخاصة يحمل جهتها
CREATE FUNCTION lessons_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_status text;
  u_org uuid;
BEGIN
  IF NEW.published_content_id IS NOT NULL THEN
    SELECT status INTO v_status FROM lesson_content_versions WHERE id = NEW.published_content_id;
    IF v_status IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION 'lesson %: published content must be an approved version (got %)', NEW.id, v_status;
    END IF;
  END IF;
  SELECT org_id INTO u_org FROM units WHERE id = NEW.unit_id;
  IF u_org IS NOT NULL AND NEW.org_id IS DISTINCT FROM u_org THEN
    RAISE EXCEPTION 'lesson %: a lesson in a private unit must belong to the same organization', NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER lessons_guard BEFORE INSERT OR UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION lessons_guard();

-- نسخة المحتوى: بعد القرار لا يُعدَّل محتواها، والمنشورة لا يُسحب اعتمادها.
-- الانتقالات المسموحة: pending → approved | rejected، و approved → superseded (حين لا تكون منشورة)
CREATE FUNCTION content_versions_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'pending' AND (NEW.lesson_id, NEW.version, NEW.explain, NEW.examples, NEW.summary, NEW.cards, NEW.source)
      IS DISTINCT FROM (OLD.lesson_id, OLD.version, OLD.explain, OLD.examples, OLD.summary, OLD.cards, OLD.source) THEN
    RAISE EXCEPTION 'content version %: decided content is immutable, create a new version', OLD.id;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
       (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected'))
    OR (OLD.status = 'approved' AND NEW.status = 'superseded')) THEN
    RAISE EXCEPTION 'content version %: status % → % is not allowed', OLD.id, OLD.status, NEW.status;
  END IF;
  IF OLD.status = 'approved' AND NEW.status <> 'approved'
     AND EXISTS (SELECT 1 FROM lessons WHERE published_content_id = OLD.id) THEN
    RAISE EXCEPTION 'content version %: it is published, publish another version first', OLD.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER content_versions_guard BEFORE UPDATE ON lesson_content_versions FOR EACH ROW EXECUTE FUNCTION content_versions_guard();

-- السؤال: هدفه من درسه (أو من وحدة درسه إن كان هدفًا على مستوى الوحدة)، ولا يُعدَّل بعد القرار،
-- ولا يُسحب اعتماده وهو في اختبار معتمد
CREATE FUNCTION questions_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  o_lesson uuid;
  o_unit uuid;
  l_unit uuid;
BEGIN
  SELECT lesson_id, unit_id INTO o_lesson, o_unit FROM objectives WHERE id = NEW.objective_id;
  SELECT unit_id INTO l_unit FROM lessons WHERE id = NEW.lesson_id;
  IF (o_lesson IS NOT NULL AND o_lesson <> NEW.lesson_id) OR (o_lesson IS NULL AND o_unit <> l_unit) THEN
    RAISE EXCEPTION 'question %: its objective belongs to another lesson', NEW.id;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'pending' AND (NEW.lesson_id, NEW.objective_id, NEW.type, NEW.difficulty, NEW.stem, NEW.payload, NEW.explanation)
        IS DISTINCT FROM (OLD.lesson_id, OLD.objective_id, OLD.type, OLD.difficulty, OLD.stem, OLD.payload, OLD.explanation) THEN
      RAISE EXCEPTION 'question %: decided questions are immutable, create a new question with replaces_id', OLD.id;
    END IF;
    IF OLD.status = 'approved' AND NEW.status <> 'approved' AND EXISTS (
         SELECT 1 FROM assessment_questions aq JOIN assessments a ON a.id = aq.assessment_id
         WHERE aq.question_id = OLD.id AND a.status = 'approved') THEN
      RAISE EXCEPTION 'question %: it is in an approved assessment, archive the assessment first', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER questions_guard BEFORE INSERT OR UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION questions_guard();

-- أسئلة الاختبار: من درس الاختبار (أو وحدته)، والاختبار المعتمد مُجمَّد
CREATE FUNCTION assessment_questions_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  a assessments%ROWTYPE;
  q_lesson uuid;
  q_unit uuid;
BEGIN
  SELECT * INTO a FROM assessments WHERE id = COALESCE(NEW.assessment_id, OLD.assessment_id);
  IF a.status = 'approved' THEN
    RAISE EXCEPTION 'assessment %: approved assessments are frozen, create a new one', a.id;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    SELECT q.lesson_id, l.unit_id INTO q_lesson, q_unit FROM questions q JOIN lessons l ON l.id = q.lesson_id WHERE q.id = NEW.question_id;
    IF (a.kind = 'lesson_quiz' AND q_lesson <> a.lesson_id) OR (a.kind = 'unit_exam' AND q_unit <> a.unit_id) THEN
      RAISE EXCEPTION 'assessment %: question % is from another lesson or unit', a.id, NEW.question_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER assessment_questions_guard BEFORE INSERT OR UPDATE OR DELETE ON assessment_questions
  FOR EACH ROW EXECUTE FUNCTION assessment_questions_guard();

-- الاختبار: لا يُعتمد إلا وفيه أسئلة، وكلها معتمدة
CREATE FUNCTION assessments_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status <> 'approved') THEN
    IF NOT EXISTS (SELECT 1 FROM assessment_questions WHERE assessment_id = NEW.id) THEN
      RAISE EXCEPTION 'assessment %: add questions before approving it', NEW.id;
    END IF;
    IF EXISTS (SELECT 1 FROM assessment_questions aq JOIN questions q ON q.id = aq.question_id
               WHERE aq.assessment_id = NEW.id AND q.status <> 'approved') THEN
      RAISE EXCEPTION 'assessment %: every question must be approved first', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER assessments_guard BEFORE INSERT OR UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION assessments_guard();

-- المحاولة: على اختبار معتمد فقط
CREATE FUNCTION attempts_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM assessments WHERE id = NEW.assessment_id AND status = 'approved') THEN
    RAISE EXCEPTION 'attempt: assessment % is not approved', NEW.assessment_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER attempts_guard BEFORE INSERT ON attempts FOR EACH ROW EXECUTE FUNCTION attempts_guard();

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
CREATE INDEX lesson_progress_lesson ON lesson_progress (lesson_id);

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
CREATE INDEX mastery_by_objective ON objective_mastery (objective_id); -- إتقان الفصل لكل هدف

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
CREATE INDEX mastery_events_objective ON mastery_events (objective_id);
CREATE INDEX mastery_events_attempt ON mastery_events (attempt_id) WHERE attempt_id IS NOT NULL;

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
CREATE INDEX remedial_objective ON remedial_plans (objective_id);
CREATE INDEX remedial_retest ON remedial_plans (retest_attempt_id) WHERE retest_attempt_id IS NOT NULL;

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
CREATE INDEX classes_grade ON classes (grade_id);

CREATE TABLE class_teachers (
  class_id      uuid NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  teacher_id    uuid NOT NULL,
  teacher_role  text NOT NULL DEFAULT 'teacher' CHECK (teacher_role = 'teacher'),
  subject_id    uuid NOT NULL REFERENCES subjects (id),
  PRIMARY KEY (class_id, teacher_id, subject_id),
  FOREIGN KEY (teacher_id, teacher_role) REFERENCES users (id, role)
);
CREATE INDEX class_teachers_teacher ON class_teachers (teacher_id);
CREATE INDEX class_teachers_subject ON class_teachers (subject_id);

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
CREATE INDEX review_tasks_content ON review_tasks (lesson_content_id) WHERE lesson_content_id IS NOT NULL;
CREATE INDEX review_tasks_assessment ON review_tasks (assessment_id) WHERE assessment_id IS NOT NULL;
CREATE INDEX review_tasks_question ON review_tasks (question_id) WHERE question_id IS NOT NULL;
CREATE INDEX review_tasks_lesson ON review_tasks (lesson_id);

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
CREATE INDEX push_subscriptions_user ON push_subscriptions (user_id);

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
CREATE INDEX audit_org ON audit_log (org_id, at DESC);

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
CREATE INDEX data_requests_subject ON data_requests (subject_id);

-- ── حذف البيانات الشخصية (حق الحذف في نظام حماية البيانات الشخصية) ──
-- صفّ المستخدم لا يُحذف أبدًا: الحذف = مسح كل بياناته الشخصية وإبقاء معرّف بلا هوية،
-- فتبقى السجلّات (المحاولات، الاعتمادات، سجلّ التدقيق) سليمة ولا يمكن ربطها بشخص.
CREATE FUNCTION anonymize_user(p_user uuid, p_actor uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users
     SET full_name = 'مستخدم محذوف', phone = NULL, email = NULL, username = NULL, password_hash = NULL,
         birth_date = NULL, last_login_at = NULL, status = 'deleted', deleted_at = now()
   WHERE id = p_user AND status <> 'deleted';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'anonymize_user: user % not found or already deleted', p_user;
  END IF;
  DELETE FROM auth_sessions WHERE user_id = p_user;
  DELETE FROM push_subscriptions WHERE user_id = p_user;
  DELETE FROM notifications WHERE user_id = p_user;
  UPDATE parent_student_links SET ended_at = now() WHERE (parent_id = p_user OR student_id = p_user) AND ended_at IS NULL;
  INSERT INTO audit_log (actor_id, action, entity_type, entity_id) VALUES (p_actor, 'user.anonymize', 'users', p_user::text);
END $$;

CREATE FUNCTION users_no_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'users are never deleted, use anonymize_user()';
END $$;
CREATE TRIGGER users_no_delete BEFORE DELETE ON users FOR EACH ROW EXECUTE FUNCTION users_no_delete();

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
  day          date NOT NULL,   -- اليوم بتوقيت الرياض (Asia/Riyadh) لا UTC: حضور الصباح الباكر يُحسب على يومه الصحيح
  status       text NOT NULL CHECK (status IN ('present', 'late', 'excused', 'absent')),
  recorded_by  uuid NOT NULL REFERENCES users (id),
  recorded_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id, day)
);
CREATE INDEX attendance_student_day ON attendance_records (student_id, day DESC);
