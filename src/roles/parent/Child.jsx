import { useState } from "react";
import { BarChart3, ClipboardCheck, GraduationCap, Mail, MessageCircle, Target, TrendingUp, Wallet } from "lucide-react";
import { Avatar, Badge, Btn, Card, Empty, ListRow, Notice, Page, Progress, Split, Stat, Tabs } from "../../ui/Primitives";
import { HBars, LineChart, Ring } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { snapshot, subjectOf, lessonOf, unitOf, remedialProgress, allObjectives, userName, studentOf, classStats, teachersOfStudent, enrollmentFor } from "../../store/selectors";
import { users, SUBJECT_PRICES } from "../../data/people";
import { fmtDate, levelLabel, timeAgo } from "../../lib/format";
import { CLOSE_THRESHOLD, GAP_THRESHOLD } from "../../lib/grading";
import { ChildSwitcher, useChild } from "./shared";

// أداء الابن: تشخيص الفجوات (F3.1) وتتبّع الإتقان والتقدّم (F3.4) كما تنعكس في لوحة وليّ الأمر
export default function ChildPage({ go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const { kids, child, select } = useChild();
  const [tab, setTab] = useState("overview");
  const snap = snapshot(state, child.id);
  const cls = state.classes.find((c) => c.id === child.classId);
  const objs = allObjectives(state);
  const attempts = state.attempts.filter((a) => a.studentId === child.id).sort((a, b) => b.at - a.at);
  const classAvg = cls ? classStats(state, cls).avg : null;
  const labels = snap.history.map((_, i) => (i === snap.history.length - 1 ? "الآن" : `-${snap.history.length - 1 - i}`));
  const teachers = teachersOfStudent(state, child.id).map((t) => ({ ...t, email: state.directory.find((d) => d.id === t.id)?.email }));
  const pendingPay = state.enrollmentRequests.filter((r) => r.studentId === child.id && r.status === "pending_parent").length;

  const pay = (req) => {
    dispatch({ type: "payEnrollment", id: req.id, actor: user.id });
    toast("تم الدفع، بانتظار اعتماد المعلّم", "success");
  };

  return (
    <Page kicker="متابعة الأداء" title="أداء الأبناء" desc="إتقان كل هدف، والفجوات مرتّبة بالأولوية، والخطة العلاجية وتقدّمها — ما يراه الطالب ومعلّمه نفسه." icon={GraduationCap}
      actions={<Btn variant="primary" icon={MessageCircle} onClick={() => setTab("pay")}>راسل المعلّم</Btn>}>
      <ChildSwitcher kids={kids} child={child} onSelect={select} />
      <div className="mt" />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "overview", label: "نظرة عامة", icon: BarChart3 }, { id: "gaps", label: "الفجوات والخطة", icon: Target, count: snap.gaps.length }, { id: "results", label: "النتائج", icon: ClipboardCheck }, { id: "pay", label: "المعلّمون والدفع", icon: Wallet, count: pendingPay }]} />

      {tab === "overview" && (
        <div className="stack">
          <div className="grid grid-3">
            <Card><div className="row"><Ring value={snap.avg} size={112} stroke={10} label="الإتقان العام" sub="إتقان عام" /><div><strong>{levelLabel(snap.avg)}</strong><p className="muted small">{snap.entries.length} أهداف مُقيَّمة</p></div></div></Card>
            <Stat label="مقارنة بمتوسط الفصل" value={classAvg ? `${snap.avg - classAvg >= 0 ? "+" : ""}${snap.avg - classAvg}` : "—"} unit="نقطة" icon={TrendingUp} tone="blue" foot={classAvg ? `متوسط الفصل ${classAvg}%` : "لا فصل مرتبط"} />
            <Stat label="أهداف متقنة" value={snap.mastered} icon={Target} foot={`الحدّ ${CLOSE_THRESHOLD}% فأكثر`} />
          </div>
          <Split>
            <Card title="التقدّم عبر الأسابيع" kicker="مقارنة بالهدف المرجعي"><LineChart values={snap.history} labels={labels} target={CLOSE_THRESHOLD} min={40} max={100} /></Card>
            <Card title="الإتقان حسب المادة" kicker={child.grade}><HBars data={Object.entries(snap.subjectAvg).map(([id, v]) => ({ label: subjectOf(id)?.name, value: v }))} /></Card>
          </Split>
          <Card title="خريطة الأهداف" kicker="كل هدف على حدة">
            <HBars data={snap.entries.map((e) => ({ label: e.title, value: e.mastery, sub: subjectOf(e.subjectId)?.name }))} />
          </Card>
        </div>
      )}

      {tab === "gaps" && (
        <div className="stack">
          <Notice tone="gold" icon={Target}>الفجوة هي هدف يقلّ الإتقان فيه عن {GAP_THRESHOLD}%. تُبنى للطالب خطة علاجية تلقائية وتُغلق عند بلوغ {CLOSE_THRESHOLD}%.</Notice>
          {snap.gaps.length === 0 && <Card><Empty icon={Target} title="لا فجوات مفتوحة" desc="أداء ممتاز!" /></Card>}
          {snap.gaps.map((g, i) => (
            <Card key={g.id}>
              <div className="row spread">
                <div><span className="kicker small">أولوية {i + 1} • {subjectOf(g.subjectId)?.name}</span><h3>{g.title}</h3></div>
                <Ring value={g.mastery} size={70} stroke={8} label="الإتقان" />
              </div>
              <div className="steps mt-sm">
                {[["reexplain", "إعادة الشرح"], ["practice", "تمارين قصيرة"], ["retest", "إعادة اختبار"]].map(([k, l]) => (
                  <div key={k} className={`step ${g.plan?.steps[k] ? "done" : ""}`}><span className="step-node">{g.plan?.steps[k] ? "✓" : "•"}</span><div><strong>{l}</strong><span>{g.plan?.steps[k] ? "أُنجزت" : "لم تبدأ"}</span></div></div>
                ))}
              </div>
              <div className="row mt-sm"><Progress value={(remedialProgress(g.plan) / 3) * 100} tone="gold" /><span className="small muted num">{remedialProgress(g.plan)}/3</span></div>
            </Card>
          ))}
        </div>
      )}

      {tab === "results" && (
        <Card title="نتائج الاختبارات" kicker={child.name}>
          {attempts.length === 0 && <Empty icon={ClipboardCheck} title="لا نتائج مسجّلة بعد" desc="ستظهر هنا نتائج الاختبارات فور أدائها." />}
          {attempts.map((a) => {
            const essay = Object.values(a.essays || {})[0];
            return (
              <ListRow key={a.id} icon={ClipboardCheck} tone={a.score >= 70 ? "success" : "warn"}
                title={a.kind === "lesson" ? lessonOf(state, a.refId)?.title : a.kind === "unit" ? unitOf(state, a.refId)?.title : "إعادة اختبار علاجي"}
                meta={`${a.kind === "unit" ? "امتحان وحدة" : a.kind === "retest" ? "علاجي" : "اختبار درس"} • ${fmtDate(a.at)}${essay ? (essay.final ? ` • مقالي: ${essay.final.score}/${essay.ai.max}` : " • مقالي قيد مراجعة المعلّم") : ""}`}
                end={<><b className="num">{a.score}%</b><Badge tone={a.score >= 85 ? "success" : a.score >= 70 ? "info" : "warn"}>{levelLabel(a.score)}</Badge></>} />
            );
          })}
        </Card>
      )}

      {tab === "pay" && (
        <div className="stack">
          <Notice tone="info" icon={Wallet}>راسل معلّمي {child.name.split(" ")[0]}، وإذا أرسل {child.name.split(" ")[0]} طلب تسجيل في مادة مدفوعة فستجد هنا زر إتمام الدفع.</Notice>
          {teachers.length === 0 ? (
            <Card><Empty icon={GraduationCap} title="لا معلّمون بعد" /></Card>
          ) : (
            <div className="grid grid-3">
              {teachers.map((t) => (
                <Card key={t.id} className="stack-sm">
                  <div className="row">
                    <Avatar name={t.name} size={44} tone="gold" />
                    <div>
                      <strong>{t.name}</strong>
                      <small className="muted" style={{ display: "block" }}>{users.find((u) => u.id === t.id)?.title || (t.homeroom ? "معلّم الفصل" : "معلّم")}</small>
                    </div>
                  </div>
                  {t.subjects.length > 0 && (
                    <div className="stack-sm">
                      {t.subjects.map((sub) => {
                        const req = enrollmentFor(state, child.id, t.id, sub);
                        return (
                          <div key={sub} className="row spread">
                            <Badge tone="info">{sub}</Badge>
                            {!req && <small className="muted num">{SUBJECT_PRICES[sub] || "—"}</small>}
                            {req?.status === "pending_parent" && <Btn size="sm" variant="gold" icon={Wallet} onClick={() => pay(req)}>ادفع {req.price}</Btn>}
                            {req?.status === "pending_teacher" && <Badge tone="info" dot>بانتظار المعلّم</Badge>}
                            {req?.status === "approved" && <Badge tone="success" dot>مُفعَّل</Badge>}
                          </div>
                        );
                      })}
                      {t.homeroom && <Badge tone="gold">معلّم الفصل</Badge>}
                    </div>
                  )}
                  {t.email && <small className="muted num" dir="ltr" style={{ textAlign: "right" }}><Mail size={12} style={{ verticalAlign: "-2px" }} /> {t.email}</small>}
                  <Btn size="sm" variant="primary" icon={MessageCircle} className="btn-block" onClick={() => go("messages", `to/${t.id}`)}>راسل المعلّم</Btn>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
