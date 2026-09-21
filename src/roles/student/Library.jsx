import { useState } from "react";
import { Bookmark, Download, FileText, Layers, PlayCircle, Trash2, Lightbulb } from "lucide-react";
import { Btn, Badge, Card, Empty, ListRow, Modal, Page, Tabs } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { allLessons, lessonOf, subjectOfLesson, lessonPublished, studentOf } from "../../store/selectors";
import { downloadText } from "../../lib/export";
import { Flashcards } from "./Lesson";

// مكتبتي: الملخصات المحفوظة (F1.4) والبطاقات (F1.6) والوسائط والملفات (F1.7)
export default function LibraryPage({ go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("summaries");
  const [view, setView] = useState(null);
  const [deck, setDeck] = useState(null);
  const stu = studentOf(state, user.id);
  const saved = state.saved[user.id]?.summaries || [];
  const mine = allLessons(state).filter((l) => lessonPublished(state, l.id) && subjectOfLesson(state, l.id)?.grade === stu.grade);
  const rated = state.saved[user.id]?.cards || {};

  const textOf = (l) => `${l.title}\n${l.summary.points.map((p) => `• ${p}`).join("\n")}\n${l.summary.terms.map(([t, d]) => `- ${t}: ${d}`).join("\n")}`;

  return (
    <Page kicker="مراجعتي" title="مكتبتي" desc="ملخصاتك المحفوظة وبطاقات المراجعة ووسائط الدروس في مكان واحد." icon={Layers}>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "summaries", label: "ملخصاتي", icon: Bookmark, count: saved.length }, { id: "cards", label: "بطاقات المراجعة", icon: Lightbulb }, { id: "media", label: "الوسائط والملفات", icon: PlayCircle }]} />

      {tab === "summaries" && (
        <Card>
          {saved.length === 0 && <Empty icon={Bookmark} title="لم تحفظ ملخصات بعد" desc="افتح أي درس واضغط «احفظ في مراجعاتي» في تبويب الملخص." action={<Btn variant="primary" onClick={() => go("learn")}>اذهب إلى المسار</Btn>} />}
          {saved.map((id) => {
            const l = lessonOf(state, id);
            if (!l) return null;
            return (
              <ListRow key={id} icon={FileText} tone={subjectOfLesson(state, id)?.tone} title={l.title} meta={`${subjectOfLesson(state, id)?.name} • ${l.summary.points.length} نقاط رئيسية`}
                end={<>
                  <Btn size="sm" variant="ghost" onClick={() => setView(l)}>فتح</Btn>
                  <Btn size="sm" variant="ghost" icon={Download} aria-label="تنزيل" onClick={() => downloadText(`ملخص-${l.title}.txt`, textOf(l))} />
                  <Btn size="sm" variant="danger" icon={Trash2} aria-label="إزالة" onClick={() => { dispatch({ type: "toggleSummary", sid: user.id, lessonId: id }); toast("أُزيل من مراجعاتي"); }} />
                </>} />
            );
          })}
        </Card>
      )}

      {tab === "cards" && (
        <div className="grid grid-3">
          {mine.filter((l) => l.cards.length).map((l) => {
            const known = l.cards.filter((_, k) => rated[`${l.id}:${k}`] === "known").length;
            const sub = subjectOfLesson(state, l.id);
            return (
              <Card key={l.id} className="deck">
                <span className={`subj-tag tone-${sub.tone}`}>{sub.glyph} {sub.name}</span>
                <h3>{l.title}</h3>
                <p className="muted small">{l.cards.length} بطاقات • أتقنت <b className="num">{known}</b></p>
                <Btn variant="primary" className="btn-block mt-sm" onClick={() => setDeck(l)}>ابدأ المراجعة</Btn>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "media" && (
        <Card>
          {mine.map((l) => (
            <div key={l.id}>
              {l.media && <ListRow icon={PlayCircle} tone="gold" title={l.media.title} meta={`${l.title} • ${l.media.length} دقيقة`} end={<Btn size="sm" variant="ghost" onClick={() => go("learn", `lesson/${l.id}`)}>مشاهدة في الدرس</Btn>} />}
              {(state.lessonState[l.id]?.files || []).map((f) => <ListRow key={f.name} icon={FileText} tone="blue" title={f.name} meta={`ملف من المعلّم • ${l.title}`} end={<Badge tone="info">{f.size}</Badge>} />)}
            </div>
          ))}
        </Card>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view?.title} kicker="ملخصي المحفوظ" footer={<Btn variant="primary" onClick={() => setView(null)}>إغلاق</Btn>}>
        {view && <div className="stack"><ol className="points">{view.summary.points.map((p) => <li key={p}>{p}</li>)}</ol><div className="stack-sm">{view.summary.terms.map(([t, d]) => <div className="term" key={t}><strong>{t}</strong><span>{d}</span></div>)}</div></div>}
      </Modal>
      <Modal open={!!deck} onClose={() => setDeck(null)} title={deck?.title} kicker="بطاقات المراجعة" footer={<Btn variant="ghost" onClick={() => setDeck(null)}>إغلاق</Btn>}>
        {deck && <Flashcards lesson={deck} />}
      </Modal>
    </Page>
  );
}
