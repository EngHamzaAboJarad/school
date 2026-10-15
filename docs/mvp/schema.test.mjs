// يشغّل schema.sql على PostgreSQL حقيقي (PGlite) ويختبر كل قاعدة ببيانات فعلية، ومنها مشاكل
// مراجعة التصميم (database.md §١١) التي يجب أن تُرفض. التشغيل: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const db = new PGlite({ extensions: { pgcrypto } });
await db.exec(readFileSync(process.argv[2] || fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8"));
const tables = await db.query(`SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`);
console.log("schema loaded:", tables.rows[0].n, "tables");

let pass = 0, fail = 0;
const ok = async (label, sql) => {
  try { await db.exec(sql); console.log("  ✓", label); pass++; }
  catch (e) { console.log("  ✗ UNEXPECTED ERROR", label, "→", e.message.split("\n")[0]); fail++; }
};
const rejects = async (label, sql) => {
  try { await db.exec(sql); console.log("  ✗ NOT REJECTED", label); fail++; }
  catch (e) { console.log("  ✓ rejected:", label, "→", e.message.split("\n")[0].slice(0, 85)); pass++; }
};
const expect = (label, cond) => { console.log(cond ? "  ✓" : "  ✗", label); cond ? pass++ : fail++; };
const one = async (sql) => (await db.query(sql)).rows[0];

const ORG = "00000000-0000-0000-0000-000000000001", ORG2 = "00000000-0000-0000-0000-000000000002";
const PARENT = "10000000-0000-0000-0000-000000000001", STUDENT = "10000000-0000-0000-0000-000000000002";
const TEACHER = "10000000-0000-0000-0000-000000000003", STRANGER = "10000000-0000-0000-0000-000000000004";
const UNIT = "20000000-0000-0000-0000-000000000004", UNIT2 = "20000000-0000-0000-0000-000000000014";
const L1 = "20000000-0000-0000-0000-000000000005", L2 = "20000000-0000-0000-0000-000000000015";
const O1 = "20000000-0000-0000-0000-000000000006", O2 = "20000000-0000-0000-0000-000000000016";
const V1 = "30000000-0000-0000-0000-000000000002", V2 = "30000000-0000-0000-0000-000000000003", VL2 = "30000000-0000-0000-0000-000000000009";
const Q1 = "40000000-0000-0000-0000-000000000001", Q2 = "40000000-0000-0000-0000-000000000002", QP = "40000000-0000-0000-0000-000000000003";
const QUIZ = "50000000-0000-0000-0000-000000000001", ATT = "60000000-0000-0000-0000-000000000001";

console.log("\n— identity, links, consent —");
await ok("organisations + users", `
  INSERT INTO organizations (id, type, name) VALUES ('${ORG}','platform','مشرق'),('${ORG2}','school','مدرسة');
  INSERT INTO users (id, org_id, role, full_name, phone, status) VALUES
    ('${PARENT}','${ORG}','parent','نورة أحمد','+966501234567','active'),
    ('${TEACHER}','${ORG}','teacher','خالد العتيبي','+966507654321','active'),
    ('${STRANGER}','${ORG}','parent','وليّ أمر آخر','+966500000004','active');
  INSERT INTO users (id, org_id, role, full_name, username, birth_date) VALUES ('${STUDENT}','${ORG}','student','سارة أحمد','sara.ahmed','2012-03-01');`);
await rejects("user with no way to sign in", `INSERT INTO users (org_id, role, full_name) VALUES ('${ORG}','parent','x')`);
await rejects("phone not in E.164", `INSERT INTO users (org_id, role, full_name, phone) VALUES ('${ORG}','parent','x','0501234567')`);
await ok("parent ↔ student link", `INSERT INTO parent_student_links (parent_id, student_id, relation) VALUES ('${PARENT}','${STUDENT}','mother')`);
await rejects("a teacher linked as parent (role enforced by the DB)", `INSERT INTO parent_student_links (parent_id, student_id, relation) VALUES ('${TEACHER}','${STUDENT}','father')`);
await ok("consents from the linked parent (granted, then revoked)", `
  INSERT INTO consents (student_id, parent_id, kind, granted, policy_version, created_at) VALUES
   ('${STUDENT}','${PARENT}','media',true,'2026-10','2026-10-01'),('${STUDENT}','${PARENT}','media',false,'2026-10','2026-10-05');`);
expect("current_consents shows the latest decision (revoked)", (await one(`SELECT granted FROM current_consents WHERE kind='media'`)).granted === false);
await rejects("[review 3] a parent NOT linked to the student gives consent", `INSERT INTO consents (student_id, parent_id, kind, granted, policy_version) VALUES ('${STUDENT}','${STRANGER}','data_processing',true,'v1')`);

console.log("\n— curriculum and content —");
await ok("curriculum chain (two units, a lesson and objective in each)", `
  INSERT INTO stages (id, code, name, position) VALUES ('20000000-0000-0000-0000-000000000001','inter','المرحلة المتوسطة',2);
  INSERT INTO grades (id, stage_id, code, name, position) VALUES ('20000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','i-3','الثالث المتوسط',3);
  INSERT INTO subjects (id, grade_id, code, name, tone) VALUES ('20000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','S-MATH','الرياضيات','math');
  INSERT INTO units (id, subject_id, no, title) VALUES ('${UNIT}','20000000-0000-0000-0000-000000000003',3,'المعادلات والدوال'),('${UNIT2}','20000000-0000-0000-0000-000000000003',4,'الهندسة');
  INSERT INTO lessons (id, unit_id, no, title) VALUES ('${L1}','${UNIT}',2,'الميل'),('${L2}','${UNIT2}',1,'الزوايا');
  INSERT INTO objectives (id, unit_id, lesson_id, code, title) VALUES ('${O1}','${UNIT}','${L1}','O-M2','يحسب الميل'),('${O2}','${UNIT2}','${L2}','O-G1','يقيس الزوايا');`);
await rejects("[review 4] objective whose lesson is in another unit", `INSERT INTO objectives (unit_id, lesson_id, code, title) VALUES ('${UNIT}','${L2}','O-X','x')`);
await rejects("publishing a lesson with no content", `UPDATE lessons SET status='published' WHERE id='${L1}'`);
await ok("AI job + content versions (L1 pending, L2 pending)", `
  INSERT INTO ai_jobs (id, kind, lesson_id, model, prompt_version, status, cost_usd) VALUES ('30000000-0000-0000-0000-000000000001','explain','${L1}','claude','explain-v1','succeeded',0.04);
  INSERT INTO lesson_content_versions (id, lesson_id, version, explain, summary, source, ai_job_id) VALUES
    ('${V1}','${L1}',1,'{"base":[{"h":"ما الميل؟","p":"..."}]}','{"points":[]}','ai','30000000-0000-0000-0000-000000000001'),
    ('${VL2}','${L2}',1,'{"base":[]}','{}','ai',NULL);
  INSERT INTO review_tasks (kind, lesson_content_id, lesson_id, title) VALUES ('lesson_content','${V1}','${L1}','شرح «الميل»');`);
await rejects("content marked approved without a decision time", `UPDATE lesson_content_versions SET status='approved' WHERE id='${V1}'`);
await rejects("review task pointing at two things", `INSERT INTO review_tasks (kind, lesson_content_id, assessment_id, title) VALUES ('lesson_content','${V1}','${V1}','x')`);
await rejects("[review 4] publishing L1 with its own version while still pending", `UPDATE lessons SET status='published', published_content_id='${V1}' WHERE id='${L1}'`);
await ok("L2's version approved", `UPDATE lesson_content_versions SET status='approved', decided_at=now() WHERE id='${VL2}'`);
await rejects("[review 4] publishing L1 with L2's approved version (another lesson)", `UPDATE lessons SET status='published', published_content_id='${VL2}' WHERE id='${L1}'`);
await ok("teacher approves → L1 published with its own version", `
  UPDATE lesson_content_versions SET status='approved', decided_by='${TEACHER}', decided_at=now() WHERE id='${V1}';
  UPDATE review_tasks SET status='approved', decided_by='${TEACHER}', decided_at=now() WHERE lesson_content_id='${V1}';
  UPDATE lessons SET status='published', published_content_id='${V1}' WHERE id='${L1}';`);
await rejects("[review 5] editing approved content in place", `UPDATE lesson_content_versions SET summary='{"points":["مختلف"]}' WHERE id='${V1}'`);
await rejects("un-approving the published version", `UPDATE lesson_content_versions SET status='superseded' WHERE id='${V1}'`);
await ok("new version approved, published, old one superseded", `
  INSERT INTO lesson_content_versions (id, lesson_id, version, explain, summary, source) VALUES ('${V2}','${L1}',2,'{"base":[]}','{}','teacher');
  UPDATE lesson_content_versions SET status='approved', decided_at=now() WHERE id='${V2}';
  UPDATE lessons SET published_content_id='${V2}' WHERE id='${L1}';
  UPDATE lesson_content_versions SET status='superseded' WHERE id='${V1}';`);
await ok("a teacher rejects a draft", `INSERT INTO lesson_content_versions (id, lesson_id, version, explain, summary, source) VALUES ('30000000-0000-0000-0000-000000000010','${L2}',2,'{"base":[]}','{}','ai'); UPDATE lesson_content_versions SET status='rejected', decided_at=now() WHERE id='30000000-0000-0000-0000-000000000010'`);
await rejects("rejected content brought back to approved", `UPDATE lesson_content_versions SET status='approved' WHERE id='30000000-0000-0000-0000-000000000010'`);

console.log("\n— private content (org_id) —");
await ok("a school adds a private unit + lesson", `
  INSERT INTO units (id, subject_id, org_id, no, title) VALUES ('20000000-0000-0000-0000-000000000024','20000000-0000-0000-0000-000000000003','${ORG2}',9,'وحدة المدرسة');
  INSERT INTO lessons (unit_id, org_id, no, title) VALUES ('20000000-0000-0000-0000-000000000024','${ORG2}',1,'درس المدرسة');`);
await rejects("[review 8] a shared (no org) lesson inside a school's private unit", `INSERT INTO lessons (unit_id, no, title) VALUES ('20000000-0000-0000-0000-000000000024',2,'x')`);

console.log("\n— questions and assessments —");
await rejects("[review 4] question on L1 measuring L2's objective", `INSERT INTO questions (lesson_id, objective_id, type, difficulty, stem, payload, explanation, source) VALUES ('${L1}','${O2}','tf','easy','q','{}','w','ai')`);
await ok("questions: two approved, one pending", `
  INSERT INTO questions (id, lesson_id, objective_id, type, difficulty, stem, payload, explanation, source, status, decided_at) VALUES
   ('${Q1}','${L1}','${O1}','mcq','easy','ميل المستقيم المار بـ (1،2) و(3،8)؟','{"options":["2","3","4","6"],"answer":1}','(8−2)÷(3−1)=3','ai','approved',now()),
   ('${Q2}','${L1}','${O1}','tf','medium','الميل الصفري يعني مستقيمًا رأسيًّا','{"answer":false}','الصفري أفقي','ai','approved',now());
  INSERT INTO questions (id, lesson_id, objective_id, type, difficulty, stem, payload, explanation, source) VALUES
   ('${QP}','${L1}','${O1}','tf','easy','سؤال لم يُعتمد','{"answer":true}','w','ai');`);
await rejects("approving an assessment that has no questions", `INSERT INTO assessments (kind, lesson_id, title, status, decided_at) VALUES ('lesson_quiz','${L1}','فارغ','approved',now())`);
await ok("quiz built as pending, then approved", `
  INSERT INTO assessments (id, kind, lesson_id, title) VALUES ('${QUIZ}','lesson_quiz','${L1}','اختبار «الميل»');
  INSERT INTO assessment_questions (assessment_id, question_id, position) VALUES ('${QUIZ}','${Q1}',1),('${QUIZ}','${Q2}',2);
  UPDATE assessments SET status='approved', decided_at=now() WHERE id='${QUIZ}';`);
await rejects("[review 4] adding a (pending) question to an approved quiz", `INSERT INTO assessment_questions (assessment_id, question_id, position) VALUES ('${QUIZ}','${QP}',3)`);
await rejects("removing a question from an approved quiz", `DELETE FROM assessment_questions WHERE assessment_id='${QUIZ}' AND question_id='${Q2}'`);
await rejects("[review 4] approving a quiz that contains a pending question", `
  INSERT INTO assessments (id, kind, lesson_id, title) VALUES ('50000000-0000-0000-0000-000000000002','lesson_quiz','${L1}','مسودة');
  INSERT INTO assessment_questions (assessment_id, question_id, position) VALUES ('50000000-0000-0000-0000-000000000002','${QP}',1);
  UPDATE assessments SET status='approved', decided_at=now() WHERE id='50000000-0000-0000-0000-000000000002';`);
await rejects("[review 4] a quiz on L2 taking a question from L1", `
  INSERT INTO assessments (id, kind, lesson_id, title) VALUES ('50000000-0000-0000-0000-000000000003','lesson_quiz','${L2}','اختبار L2');
  INSERT INTO assessment_questions (assessment_id, question_id, position) VALUES ('50000000-0000-0000-0000-000000000003','${Q1}',1);`);
await rejects("a second approved quiz for the same lesson", `
  INSERT INTO assessments (id, kind, lesson_id, title) VALUES ('50000000-0000-0000-0000-000000000004','lesson_quiz','${L1}','نسخة ثانية');
  INSERT INTO assessment_questions (assessment_id, question_id, position) VALUES ('50000000-0000-0000-0000-000000000004','${Q1}',1);
  UPDATE assessments SET status='approved', decided_at=now() WHERE id='50000000-0000-0000-0000-000000000004';`);
await rejects("unit exam without a unit", `INSERT INTO assessments (kind, title) VALUES ('unit_exam','x')`);
await rejects("[review 5] editing an approved question's text", `UPDATE questions SET stem='نصّ آخر' WHERE id='${Q1}'`);
await rejects("retiring a question that is inside an approved quiz", `UPDATE questions SET status='retired' WHERE id='${Q1}'`);
await ok("[review 5] editing = a new question that replaces the old one", `
  INSERT INTO questions (lesson_id, objective_id, type, difficulty, stem, payload, explanation, source, replaces_id) VALUES
   ('${L1}','${O1}','mcq','easy','نصّ مُحسَّن','{"options":["2","3"],"answer":1}','w','teacher','${Q1}');`);

console.log("\n— attempts, mastery, remedial —");
await rejects("a parent taking a quiz (attempts are students only)", `INSERT INTO attempts (student_id, assessment_id) VALUES ('${PARENT}','${QUIZ}')`);
await rejects("an attempt on an assessment that is not approved", `INSERT INTO attempts (student_id, assessment_id) VALUES ('${STUDENT}','50000000-0000-0000-0000-000000000003')`);
await rejects("submitted attempt without a score", `INSERT INTO attempts (student_id, assessment_id, status, submitted_at) VALUES ('${STUDENT}','${QUIZ}','submitted',now())`);
await ok("student submits (offline client id) + answers + mastery + progress", `
  INSERT INTO attempts (id, student_id, assessment_id, status, submitted_at, earned_points, max_points, score, duration_sec, client_id) VALUES ('${ATT}','${STUDENT}','${QUIZ}','submitted',now(),1,2,50,240,'dev-abc-1');
  INSERT INTO attempt_answers (attempt_id, question_id, answer, is_correct, points) VALUES ('${ATT}','${Q1}','1',true,1),('${ATT}','${Q2}','true',false,0);
  INSERT INTO objective_mastery (student_id, objective_id, mastery) VALUES ('${STUDENT}','${O1}',58);
  INSERT INTO mastery_events (student_id, objective_id, attempt_id, before, after) VALUES ('${STUDENT}','${O1}','${ATT}',NULL,58);
  INSERT INTO lesson_progress (student_id, lesson_id, status, best_score, completed_at) VALUES ('${STUDENT}','${L1}','completed',50,now());`);
await rejects("the same offline submission sent twice", `INSERT INTO attempts (student_id, assessment_id, client_id) VALUES ('${STUDENT}','${QUIZ}','dev-abc-1')`);
await rejects("mastery above 100", `UPDATE objective_mastery SET mastery=120`);
await ok("gap → open remedial plan", `INSERT INTO remedial_plans (student_id, objective_id) VALUES ('${STUDENT}','${O1}')`);
await rejects("a second open plan for the same objective", `INSERT INTO remedial_plans (student_id, objective_id) VALUES ('${STUDENT}','${O1}')`);
await rejects("closing a plan without a reason", `UPDATE remedial_plans SET closed_at=now()`);
expect("gap query finds 1 objective below 70", (await one(`SELECT count(*)::int n FROM objective_mastery WHERE student_id='${STUDENT}' AND mastery < 70`)).n === 1);

console.log("\n— classes —");
await ok("class with its teacher", `
  INSERT INTO classes (id, org_id, grade_id, name, academic_year) VALUES ('70000000-0000-0000-0000-000000000001','${ORG}','20000000-0000-0000-0000-000000000002','أ','1447-1448');
  INSERT INTO class_teachers (class_id, teacher_id, subject_id) VALUES ('70000000-0000-0000-0000-000000000001','${TEACHER}','20000000-0000-0000-0000-000000000003');`);
await rejects("a parent added as a class teacher", `INSERT INTO class_teachers (class_id, teacher_id, subject_id) VALUES ('70000000-0000-0000-0000-000000000001','${PARENT}','20000000-0000-0000-0000-000000000003')`);
await rejects("a teacher enrolled as a class student", `INSERT INTO class_students (class_id, student_id) VALUES ('70000000-0000-0000-0000-000000000001','${TEACHER}')`);

console.log("\n— audit and deletion —");
await ok("audit entry", `INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id) VALUES ('${TEACHER}','teacher','content.approve','lesson_content_versions','${V1}')`);
await rejects("editing the audit log", `UPDATE audit_log SET action='x'`);
await rejects("deleting from the audit log", `DELETE FROM audit_log`);
await rejects("[review 2/6] hard-deleting a user (use anonymize_user)", `DELETE FROM users WHERE id='${STUDENT}'`);
await ok("[review 2] «delete my data» for the teacher (in the audit log)", `SELECT anonymize_user('${TEACHER}', '${PARENT}')`);
await ok("[review 2/6] «delete my data» for the student (has attempts, consents, mastery)", `SELECT anonymize_user('${STUDENT}', '${PARENT}')`);
const s = await one(`SELECT full_name, phone, username, birth_date, status FROM users WHERE id='${STUDENT}'`);
expect("student's personal data is gone", s.full_name === "مستخدم محذوف" && s.username === null && s.birth_date === null && s.status === "deleted");
expect("their learning records are kept, unlinked from a person", (await one(`SELECT count(*)::int n FROM attempts WHERE student_id='${STUDENT}'`)).n === 1);
expect("the parent link is ended, not deleted", (await one(`SELECT count(*)::int n FROM parent_student_links WHERE student_id='${STUDENT}' AND ended_at IS NOT NULL`)).n === 1);
expect("the anonymization itself is audited", (await one(`SELECT count(*)::int n FROM audit_log WHERE action='user.anonymize'`)).n === 2);
await rejects("anonymizing the same user twice", `SELECT anonymize_user('${STUDENT}')`);

console.log("\n— indexes —");
const unindexed = (await db.query(`
  SELECT c.conrelid::regclass::text AS t, a.attname AS col
  FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
  WHERE c.contype = 'f' AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1])`)).rows;
const ACTOR = new Set(["created_by", "decided_by", "requested_by", "recorded_by", "assigned_to", "actor_id"]);
const missing = unindexed.filter((r) => !ACTOR.has(r.col));
expect(`[review 7] every foreign key is indexed except «who did it» columns (${unindexed.length} actor columns left${missing.length ? "; MISSING: " + missing.map((r) => r.t + "." + r.col).join(", ") : ""})`, missing.length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
