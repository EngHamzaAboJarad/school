import { useMemo, useState } from "react";
import { GraduationCap, Mail, MessageCircle, UserPlus } from "lucide-react";
import { Avatar, Badge, Btn, Card, Empty, Field, Modal, Page, SearchBox, Select } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { teachersOfStudent, enrollmentFor } from "../../store/selectors";
import { normalizeAr } from "../../lib/rng";
import { users, SUBJECT_PRICES } from "../../data/people";

const REQ_LABEL = { pending_parent: "بانتظار ولي الأمر", pending_teacher: "بانتظار المعلّم", approved: "مُفعَّل" };
const REQ_TONE = { pending_parent: "warn", pending_teacher: "info", approved: "success" };

// معلّموّي: دليل بحث لمعلّمي مواد الطالب المستخرَجين من جدوله الأسبوعي (F5.3)
export default function TeachersPage({ go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [enroll, setEnroll] = useState(null);
  const [subject, setSubject] = useState("");
  const teachers = useMemo(() => teachersOfStudent(state, user.id), [state, user.id]);

  const rows = useMemo(() => {
    const nq = normalizeAr(q.trim());
    return teachers
      .map((t) => ({ ...t, title: users.find((u) => u.id === t.id)?.title, email: state.directory.find((d) => d.id === t.id)?.email }))
      .filter((t) => !nq || normalizeAr(`${t.name} ${t.title || ""} ${t.subjects.join(" ")}`).includes(nq));
  }, [teachers, q, state.directory]);

  const availableSubjects = (t) => t.subjects.filter((sub) => !enrollmentFor(state, user.id, t.id, sub));
  const openEnroll = (t) => { const avail = availableSubjects(t); setEnroll(t); setSubject(avail[0] || ""); };
  const price = subject && (SUBJECT_PRICES[subject] || "السعر غير محدَّد حاليًّا");

  const sendRequest = () => {
    dispatch({ type: "requestEnrollment", studentId: user.id, teacherId: enroll.id, subject, price: SUBJECT_PRICES[subject] || "السعر غير محدَّد" });
    toast("أُرسل طلب التسجيل إلى وليّ أمرك لاستكماله والدفع");
    setEnroll(null);
  };

  return (
    <Page kicker="تواصل آمن" title="معلّموّي" desc="ابحث عن معلّميك حسب الاسم أو المادة، وراسلهم أو اطلب التسجيل لديهم." icon={GraduationCap}>
      <div className="stack">
        <Card><SearchBox value={q} onChange={setQ} placeholder="ابحث بالاسم أو المادة…" /></Card>

        {rows.length === 0 ? (
          <Card><Empty icon={GraduationCap} title="لا يوجد معلّمون مطابقون" desc="جرّب كلمة بحث أخرى." /></Card>
        ) : (
          <div className="grid grid-3">
            {rows.map((t) => {
              const avail = availableSubjects(t);
              return (
                <Card key={t.id} className="stack-sm">
                  <div className="row">
                    <Avatar name={t.name} size={44} tone="gold" />
                    <div>
                      <strong>{t.name}</strong>
                      <small className="muted" style={{ display: "block" }}>{t.title || (t.homeroom ? "معلّم الفصل" : "معلّم")}</small>
                    </div>
                  </div>
                  {t.subjects.length > 0 && (
                    <div className="stack-sm">
                      {t.subjects.map((sub) => {
                        const req = enrollmentFor(state, user.id, t.id, sub);
                        return (
                          <div key={sub} className="row spread">
                            <Badge tone="info">{sub}</Badge>
                            {req ? <Badge tone={REQ_TONE[req.status]} dot>{REQ_LABEL[req.status]}</Badge> : <small className="muted num">{SUBJECT_PRICES[sub] || "—"}</small>}
                          </div>
                        );
                      })}
                      {t.homeroom && <Badge tone="gold">معلّم الفصل</Badge>}
                    </div>
                  )}
                  {t.email && <small className="muted num" dir="ltr" style={{ textAlign: "right" }}><Mail size={12} style={{ verticalAlign: "-2px" }} /> {t.email}</small>}
                  <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                    <Btn size="sm" variant="primary" icon={MessageCircle} style={{ flex: 1 }} onClick={() => go("messages", `to/${t.id}`)}>راسل المعلّم</Btn>
                    <Btn size="sm" variant="gold" icon={UserPlus} style={{ flex: 1 }} disabled={avail.length === 0} onClick={() => openEnroll(t)}>طلب تسجيل</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!enroll} onClose={() => setEnroll(null)} title="طلب تسجيل لدى المعلّم" kicker={enroll?.name}
        footer={<><Btn variant="ghost" onClick={() => setEnroll(null)}>إلغاء</Btn><Btn variant="primary" icon={UserPlus} disabled={!subject} onClick={sendRequest}>إرسال الطلب</Btn></>}>
        {enroll && (
          <div className="stack">
            <Field label="المادة"><Select value={subject} onChange={(e) => setSubject(e.target.value)}>{availableSubjects(enroll).map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
            <div className="row spread"><span className="muted small">سعر التسجيل</span><strong className="num">{price}</strong></div>
            <small className="muted small">يُرسَل طلبك إلى وليّ أمرك لاستكماله ودفع رسومه، ثم يعتمده المعلّم لتفعيل تسجيلك.</small>
          </div>
        )}
      </Modal>
    </Page>
  );
}
