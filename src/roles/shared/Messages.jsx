import { useEffect, useRef, useState } from "react";
import { Megaphone, MessageCircle, PenSquare, Send, Eye } from "lucide-react";
import { Avatar, Btn, Badge, Card, Empty, Field, Input, Modal, Page, Select, Tabs, Textarea, cx } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { childrenOf, myAnnouncements, myThreads, unreadThreads, userName, studentOf } from "../../store/selectors";
import { timeAgo } from "../../lib/format";

// المراسلة والإعلانات (F5.3 / F9.2): رسائل مباشرة بين ولي الأمر والمعلّم/الإدارة، وإعلانات للفصل أو المدرسة مع تتبّع القراءة.
function recipientsFor(state, user) {
  const opt = (id, note) => ({ id, name: userName(state, id), note });
  if (user.role === "student") {
    const cls = state.classes.find((c) => c.id === studentOf(state, user.id)?.classId);
    return [opt(cls?.teacherId, "معلّمي")];
  }
  if (user.role === "parent") {
    const ts = [...new Set(childrenOf(state, user.id).map((c) => c.teacherId))];
    return [...ts.map((t) => opt(t, "معلّم ابنك")), opt("adm-school", "إدارة المدرسة")];
  }
  if (user.role === "teacher") return [opt("par-noura", "وليّ أمر سارة وليان"), opt("adm-school", "إدارة المدرسة"), ...state.classes.filter((c) => c.teacherId === user.id).flatMap((c) => c.studentIds.slice(0, 3)).map((id) => opt(id, "طالب"))];
  if (user.role === "school") return [opt("tch-khaled", "معلّم"), opt("tch-sarah", "معلّم"), opt("par-noura", "وليّ أمر")];
  return [];
}

export default function Messages() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("inbox");
  const [sel, setSel] = useState(null);
  const [text, setText] = useState("");
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState({ to: "", subject: "", text: "" });
  const [ann, setAnn] = useState(false);
  const [annDraft, setAnnDraft] = useState({ title: "", body: "", audience: "all" });
  const end = useRef(null);
  const threads = myThreads(state, user.id);
  const current = threads.find((t) => t.id === sel) || threads[0];
  const announcements = myAnnouncements(state, user);
  const canAnnounce = user.role === "teacher" || user.role === "school";
  const recipients = recipientsFor(state, user);

  useEffect(() => {
    if (current && tab === "inbox") dispatch({ type: "readThread", threadId: current.id, userId: user.id });
    // نمرّر صندوق الرسائل فقط — لا الصفحة كلها — حتى لا تقفز الصفحة للأسفل عند الفتح
    const box = end.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [current?.id, current?.msgs.length, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = () => {
    if (!text.trim() || !current) return;
    dispatch({ type: "sendMessage", threadId: current.id, from: user.id, text: text.trim() });
    setText("");
  };

  const other = (t) => t.participants.find((p) => p !== user.id);

  return (
    <Page kicker="تواصل آمن" title={canAnnounce ? "الرسائل والإعلانات" : "الرسائل"} desc="تبادل الرسائل وتابعها، واطّلع على إعلانات الفصل والمدرسة."
      icon={MessageCircle} actions={<>
        {canAnnounce && <Btn variant="ghost" icon={Megaphone} onClick={() => setAnn(true)}>إعلان جديد</Btn>}
        {recipients.length > 0 && <Btn variant="primary" icon={PenSquare} onClick={() => { setDraft({ to: recipients[0].id, subject: "", text: "" }); setCompose(true); }}>رسالة جديدة</Btn>}
      </>}>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "inbox", label: "الرسائل", icon: MessageCircle, count: unreadThreads(state, user.id) }, { id: "ann", label: "الإعلانات", icon: Megaphone }]} />

      {tab === "inbox" && (
        threads.length === 0 ? <Card><Empty icon={MessageCircle} title="لا رسائل بعد" desc="ابدأ محادثة جديدة مع معلّمك أو إدارة المدرسة." /></Card> : (
          <div className="mail">
            <Card flush className="mail-list">
              {threads.map((t) => {
                const last = t.msgs[t.msgs.length - 1];
                const unread = last.from !== user.id && (t.readBy?.[user.id] || 0) < last.at;
                return (
                  <button key={t.id} className={cx("mail-item", current?.id === t.id && "active", unread && "unread")} onClick={() => setSel(t.id)}>
                    <Avatar name={userName(state, other(t))} tone={last.from === user.id ? "gold" : undefined} />
                    <div>
                      <div className="row spread"><strong>{userName(state, other(t))}</strong><small className="muted">{timeAgo(last.at)}</small></div>
                      <b className="mail-subject">{t.subject}</b>
                      <span className="mail-preview">{last.text}</span>
                    </div>
                    {unread && <i className="unread-dot" aria-label="غير مقروءة" />}
                  </button>
                );
              })}
            </Card>
            {current && (
              <Card className="mail-thread" flush>
                <div className="thread-head"><Avatar name={userName(state, other(current))} /><div><strong>{userName(state, other(current))}</strong><small className="muted">{current.subject}</small></div></div>
                <div className="thread-msgs">
                  {current.msgs.map((m, i) => (
                    <div key={i} className={cx("msg", m.from === user.id ? "mine" : "theirs")}>
                      <p>{m.text}</p><small>{timeAgo(m.at)}</small>
                    </div>
                  ))}
                  <div ref={end} />
                </div>
                <form className="thread-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
                  <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب ردّك…" aria-label="الرد" />
                  <Btn type="submit" variant="primary" icon={Send} disabled={!text.trim()}>إرسال</Btn>
                </form>
              </Card>
            )}
          </div>
        )
      )}

      {tab === "ann" && (
        <div className="stack">
          {announcements.length === 0 && <Card><Empty icon={Megaphone} title="لا إعلانات" /></Card>}
          {announcements.map((a) => {
            const read = a.readBy.includes(user.id);
            return (
              <Card key={a.id} className={cx("ann", !read && "unread")} onMouseEnter={() => !read && dispatch({ type: "readAnnouncement", id: a.id, userId: user.id })}>
                <div className="row spread">
                  <div className="row"><span className="ann-icon"><Megaphone size={18} /></span><div><h3>{a.title}</h3><small className="muted">{userName(state, a.from)} • {timeAgo(a.at)}</small></div></div>
                  <div className="row"><Badge tone="gold">{{ all: "للجميع", parents: "أولياء الأمور", teachers: "المعلّمون", students: "الطلاب" }[a.audience]}</Badge>
                    {canAnnounce && a.from === user.id || user.role === "school" ? <Badge tone="info" icon={Eye}>قرأها {a.readBy.length}</Badge> : !read && <Badge tone="warn" dot>جديد</Badge>}</div>
                </div>
                <p className="mt-sm">{a.body}</p>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={compose} onClose={() => setCompose(false)} title="رسالة جديدة" kicker="تواصل" footer={<><Btn variant="ghost" onClick={() => setCompose(false)}>إلغاء</Btn>
        <Btn variant="primary" icon={Send} disabled={!draft.subject.trim() || !draft.text.trim()} onClick={() => { dispatch({ type: "newThread", from: user.id, to: draft.to, subject: draft.subject, text: draft.text }); setCompose(false); setTab("inbox"); setSel(null); toast("أُرسلت الرسالة"); }}>إرسال</Btn></>}>
        <div className="stack">
          <Field label="إلى"><Select value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })}>{recipients.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.note}</option>)}</Select></Field>
          <Field label="الموضوع"><Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></Field>
          <Field label="الرسالة"><Textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></Field>
        </div>
      </Modal>
      <Modal open={ann} onClose={() => setAnn(false)} title="إعلان جديد" kicker="إعلان للفصل أو المدرسة" footer={<><Btn variant="ghost" onClick={() => setAnn(false)}>إلغاء</Btn>
        <Btn variant="primary" icon={Megaphone} disabled={!annDraft.title.trim() || !annDraft.body.trim()} onClick={() => { dispatch({ type: "announce", from: user.id, ...annDraft }); setAnn(false); setAnnDraft({ title: "", body: "", audience: "all" }); setTab("ann"); toast("نُشر الإعلان وأُشعر المستهدفون"); }}>نشر الإعلان</Btn></>}>
        <div className="stack">
          <Field label="الفئة المستهدفة"><Select value={annDraft.audience} onChange={(e) => setAnnDraft({ ...annDraft, audience: e.target.value })}><option value="all">الجميع</option><option value="parents">أولياء الأمور</option><option value="students">الطلاب</option>{user.role === "school" && <option value="teachers">المعلّمون</option>}</Select></Field>
          <Field label="العنوان"><Input value={annDraft.title} onChange={(e) => setAnnDraft({ ...annDraft, title: e.target.value })} /></Field>
          <Field label="النص"><Textarea value={annDraft.body} onChange={(e) => setAnnDraft({ ...annDraft, body: e.target.value })} /></Field>
        </div>
      </Modal>
    </Page>
  );
}
