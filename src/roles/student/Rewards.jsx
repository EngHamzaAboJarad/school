import { useState } from "react";
import { Award, Flame, Gift, Lock, Medal, ScrollText, ShieldCheck, Star, Trophy } from "lucide-react";
import { Badge, Btn, Card, Empty, ListRow, Page, Progress, Split, Tabs, cx } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { badgesOf, leaderboard, studentOf, pointsLogOf } from "../../store/selectors";
import { fmtDate, timeAgo } from "../../lib/format";
import { dateKey } from "../../data/seed";
import { FactLine, VentLegend, VentRow } from "../../ui/World";
import { schoolDays } from "../shared/walls";

const ICON = { first: Star, ace: Award, streak: Flame, gap: Medal, unit: Trophy, master: Award };

const CATALOG = [
  { id: "avatar-frame", title: "إطار ذهبي للصورة الشخصية", cost: 150, icon: Star, desc: "إطار مميّز حول صورتك في التطبيق" },
  { id: "hw-pass", title: "إعفاء من واجب واحد", cost: 300, icon: ShieldCheck, desc: "يعتمدها معلّمك عند أول واجب قادم" },
  { id: "cert", title: "شهادة تقدير رقمية", cost: 500, icon: ScrollText, desc: "شهادة قابلة للتنزيل والمشاركة مع وليّ أمرك" },
  { id: "leader-pin", title: "دبّوس صدارة الفصل", cost: 250, icon: Trophy, desc: "يظهر بجانب اسمك في لوحة الصدارة لأسبوع" },
];

// التلعيب والتحفيز (F3.5): نقاط وشارات وسلسلة استمرارية ولوحة صدارة الفصل، وسجلّ ومتجر للنقاط
export default function RewardsPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const stu = studentOf(state, user.id);
  const points = state.points[user.id] || 0;
  const level = Math.floor(points / 500) + 1;
  const into = points % 500;
  const streak = state.streaks[user.id] || 0;
  const badges = badgesOf(state, user.id);
  const board = leaderboard(state, stu.classId);
  const rank = board.findIndex((b) => b.id === user.id) + 1;
  const attempts = state.attempts.filter((a) => a.studentId === user.id);
  const activeDays = new Set([...attempts.map((a) => dateKey(a.at)), ...Object.values(state.progress[user.id] || {}).filter((p) => p.done && p.at).map((p) => dateKey(p.at))]);
  const activity = schoolDays(10).map((t) => ({ state: activeDays.has(dateKey(t)) ? "on" : "off", title: `${fmtDate(t, { weekday: "long", day: "numeric", month: "long" })}: ${activeDays.has(dateKey(t)) ? "تعلّمت" : "لا نشاط"}` }));
  const className = state.classes.find((c) => c.id === stu.classId)?.name;
  const log = pointsLogOf(state, user.id);

  const redeem = (r) => {
    dispatch({ type: "redeemReward", studentId: user.id, cost: r.cost, title: r.title });
    toast(`استبدلت «${r.title}»`, "success");
  };

  return (
    <Page kicker="تحفيز" title="إنجازاتي" desc="نقاط وشارات وسلسلة استمرارية تكافئ مواظبتك وتقدّمك." icon={Trophy}>
      <div className="rw-top">
        <Card tone="dark" className="card-dark level-card">
          <span className="kicker small" style={{ color: "var(--gold-300)" }}>المستوى</span>
          <div className="level-num num">{level}</div>
          <Progress value={(into / 500) * 100} tone="gold" size="lg" label="التقدّم للمستوى التالي" />
          <small style={{ color: "rgba(251,248,241,.7)" }}>{500 - into} نقطة للمستوى {level + 1}</small>
        </Card>
        <div className="rw-facts">
          <FactLine
            items={[
              { label: "إجمالي النقاط", value: points.toLocaleString("en-US"), note: "تُمنح تلقائيًّا على كل نشاط" },
              { label: "ترتيبي في الفصل", value: rank || null, note: `من ${board.length} • بحسب النقاط` },
              { label: "سلسلة التعلّم", value: streak, note: "أيام متواصلة" },
            ]}
          />
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} className="mt" tabs={[{ id: "overview", label: "نظرة عامة", icon: Trophy }, { id: "log", label: "سجلّ النقاط", icon: ScrollText }, { id: "store", label: "متجر المكافآت", icon: Gift }]} />

      {tab === "overview" && (
        <Split className="mt">
          <div className="stack">
            <Card title="سلسلة التعلّم" kicker={`${streak} أيام متواصلة • آخر 10 أيام دراسية`}>
              <VentRow size={22} items={activity} label={`أيام النشاط في آخر 10 أيام دراسية: ${activity.filter((a) => a.state === "on").length}`} />
              <VentLegend items={[{ state: "on", label: "يوم فيه اختبار أو درس منجز" }, { state: "off", label: "لا نشاط" }]} />
              <p className="muted small mt-sm">أنجز نشاطًا واحدًا على الأقل كل يوم دراسي للحفاظ على السلسلة.</p>
            </Card>
            <Card title="شاراتي" kicker={`${badges.filter((b) => b.earned).length} من ${badges.length}`}>
              <div className="badges">
                {badges.map((b) => {
                  const Icon = ICON[b.id] || Award;
                  return (
                    <div key={b.id} className={cx("badge-card", b.earned && "earned")}>
                      <span className="badge-medal">{b.earned ? <Icon size={26} /> : <Lock size={20} />}</span>
                      <strong>{b.title}</strong>
                      <small>{b.desc}</small>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
          <Card title="لوحة صدارة الفصل" kicker={className}>
            <ol className="board">
              {board.map((b, i) => (
                <li key={b.id} className={cx(b.id === user.id && "me")}>
                  <span className={cx("rank num", i < 3 && `r${i + 1}`)}>{i + 1}</span>
                  <strong>{b.id === user.id ? `${b.name.split(" ")[0]} (أنا)` : b.name.split(" ")[0]}</strong>
                  <b className="num">{b.points.toLocaleString("en-US")}</b>
                </li>
              ))}
            </ol>
          </Card>
        </Split>
      )}

      {tab === "log" && (
        <Card className="mt" title="من أين جاءت نقاطي؟" kicker="أحدث أولًا">
          {log.length === 0 ? <Empty icon={ScrollText} title="لا حركات بعد" desc="أنجز اختبارًا أو استبدل مكافأة لتظهر هنا." /> : (
            log.map((p) => (
              <ListRow key={p.id} icon={p.amount >= 0 ? Award : Gift} tone={p.amount >= 0 ? "success" : "gold"} title={p.reason}
                meta={timeAgo(p.at)} end={<Badge tone={p.amount >= 0 ? "success" : "gold"}>{p.amount >= 0 ? "+" : ""}{p.amount}</Badge>} />
            ))
          )}
        </Card>
      )}

      {tab === "store" && (
        <div className="mt">
          <div className="grid grid-3">
            {CATALOG.map((r) => {
              const Icon = r.icon;
              const can = points >= r.cost;
              return (
                <Card key={r.id} className="stack-sm">
                  <div className="row"><span className="row-icon tone-gold"><Icon size={18} /></span><strong>{r.title}</strong></div>
                  <p className="muted small">{r.desc}</p>
                  <div className="row spread">
                    <b className="num">{r.cost.toLocaleString("en-US")} نقطة</b>
                    <Btn size="sm" variant={can ? "gold" : "ghost"} disabled={!can} onClick={() => redeem(r)}>استبدال</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </Page>
  );
}
