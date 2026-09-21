import { useState } from "react";
import { BarChart3, Download, Send, Sparkles, Users } from "lucide-react";
import { Avatar, Badge, Btn, Card, Empty, ListRow, Notice, Page, Select, Split, Stat } from "../../ui/Primitives";
import { Bars, Heatmap, Legend, Ring } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { allObjectives, classStats, commonGaps, lessonOf, teacherSubjects, subjectOf } from "../../store/selectors";
import { downloadCSV } from "../../lib/export";

// متابعة أداء الفصل (F6.5): الطلاب المتعثّرون والفجوات الشائعة وخريطة الإتقان
export default function PerformancePage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const classes = state.classes.filter((c) => c.teacherId === user.id);
  const [clsId, setClsId] = useState(classes[0]?.id);
  const cls = classes.find((c) => c.id === clsId);
  const subs = teacherSubjects(state, user.id);
  const objs = allObjectives(state).filter((o) => subs.includes(o.subjectId) && o.lessonId);
  const stats = classStats(state, cls);
  const gaps = commonGaps(state, cls, objs.map((o) => o.id));
  const bands = [["أقل من 55", 0, 55, "low"], ["55 – 69", 55, 70, "mid"], ["70 – 84", 70, 85, "good"], ["85 فأكثر", 85, 101, "great"]].map(([label, lo, hi, tone]) => ({ label, tone, value: stats.rows.filter((r) => r.assessed && r.avg >= lo && r.avg < hi).length }));

  const exportCsv = () => {
    downloadCSV(`أداء-${cls.name}`, [["الطالب", "الإتقان العام", "عدد الفجوات", "دروس مكتملة", "النقاط", ...objs.map((o) => o.title)], ...stats.rows.map((r) => [r.name, r.assessed ? r.avg : "", r.gaps, r.lessonsDone, r.points, ...objs.map((o) => state.mastery[r.id]?.[o.id] ?? "")])]);
    toast("صُدِّر تقرير الفصل (CSV)");
  };

  return (
    <Page kicker="تحليلات الفصل" title="أداء الفصل" desc="حدّد الطلاب المتعثّرين والفجوات الشائعة لتوجّه شرحك وتولّد تمارين علاجية." icon={BarChart3}
      actions={<><Select value={clsId} onChange={(e) => setClsId(e.target.value)} aria-label="الفصل">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><Btn variant="ghost" icon={Download} onClick={exportCsv}>تصدير Excel</Btn></>}>
      <div className="grid grid-4">
        <Stat label="متوسط الفصل" value={stats.avg} unit="%" icon={BarChart3} />
        <Stat label="طلاب متعثّرون" value={stats.struggling.length} tone="rose" icon={Users} foot="أقل من 70%" />
        <Stat label="فجوات شائعة" value={gaps.filter((g) => g.weak >= 2).length} tone="gold" icon={Sparkles} foot="أهداف يتعثّر فيها ٢ فأكثر" />
        <Stat label="دروس مكتملة" value={stats.rows.reduce((a, r) => a + r.lessonsDone, 0)} tone="blue" icon={Users} foot="مجموع الفصل" />
      </div>

      <Split className="mt">
        <Card title="خريطة الإتقان" kicker="الطلاب × أهداف التعلّم">
          <Heatmap cols={objs.map((o) => ({ id: o.id, label: `${subjectOf(o.subjectId)?.glyph}${objs.filter((x) => x.subjectId === o.subjectId).indexOf(o) + 1}`, title: o.title }))}
            rows={stats.rows.map((r) => ({ id: r.id, label: r.name, cells: objs.map((o) => state.mastery[r.id]?.[o.id] ?? null) }))} />
          <Legend />
          <div className="obj-key">{objs.map((o) => <span key={o.id}><b>{subjectOf(o.subjectId)?.glyph}{objs.filter((x) => x.subjectId === o.subjectId).indexOf(o) + 1}</b> {o.title}</span>)}</div>
        </Card>
        <div className="stack">
          <Card title="توزيع مستويات الطلاب" kicker="عدد الطلاب"><Bars data={bands} max={Math.max(4, ...bands.map((b) => b.value))} height={140} /></Card>
        </div>
      </Split>

      <div className="grid grid-2 mt">
        <Card title="الفجوات الشائعة" kicker="أين يتعثّر الفصل؟">
          {gaps.length === 0 && <Empty title="لا بيانات كافية" />}
          {gaps.slice(0, 5).map((g) => (
            <ListRow key={g.objective.id} icon={Sparkles} tone={g.weak >= 3 ? "rose" : "warn"} title={g.objective.title} meta={`متوسط الفصل ${g.avg}% • ${g.weak} من ${g.assessed} يتعثّرون`}
              end={g.weak > 0 && <Btn size="sm" variant="ghost" onClick={() => { dispatch({ type: "generateBatch", lessonId: g.objective.lessonId, count: 3, difficulty: "متوسط", actor: user.id }); toast("وُلِّدت أسئلة علاجية بانتظار اعتمادك"); }}>ولّد تمارين علاجية</Btn>} />
          ))}
        </Card>
        <Card title="الطلاب المتعثّرون" kicker="بحاجة لمتابعة">
          {stats.struggling.length === 0 && <Notice tone="success">لا طلاب دون الحدّ.</Notice>}
          {stats.struggling.map((s) => (
            <ListRow key={s.id} avatar={s.name} tone="rose" title={s.name} meta={`${s.gaps} فجوات • ${s.lessonsDone} دروس مكتملة`} end={<><Badge tone="danger">{s.avg}%</Badge>
              <Btn size="sm" variant="ghost" icon={Send} aria-label="مراسلة" onClick={() => { dispatch({ type: "newThread", from: user.id, to: s.id, subject: "متابعة مستواك", text: "لاحظتُ أنك تحتاج إلى دعم إضافي. راجع خطتك العلاجية في المنصة وسأتابع معك." }); toast(`أُرسلت رسالة إلى ${s.name}`); }} /></>} />
          ))}
        </Card>
      </div>
    </Page>
  );
}
