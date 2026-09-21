import { Award, Flame, Lock, Medal, Star, Trophy } from "lucide-react";
import { Card, Page, Progress, Split, Stat, cx } from "../../ui/Primitives";
import { useStore } from "../../store/StoreProvider";
import { badgesOf, leaderboard, studentOf } from "../../store/selectors";

const ICON = { first: Star, ace: Award, streak: Flame, gap: Medal, unit: Trophy, master: Award };

// التلعيب والتحفيز (F3.5): نقاط وشارات وسلاسل استمرارية ولوحة صدارة الفصل
export default function RewardsPage() {
  const { state, user } = useStore();
  const stu = studentOf(state, user.id);
  const points = state.points[user.id] || 0;
  const level = Math.floor(points / 500) + 1;
  const into = points % 500;
  const streak = state.streaks[user.id] || 0;
  const badges = badgesOf(state, user.id);
  const board = leaderboard(state, stu.classId);
  const rank = board.findIndex((b) => b.id === user.id) + 1;
  const days = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس"];
  const className = state.classes.find((c) => c.id === stu.classId)?.name;

  return (
    <Page kicker="تحفيز" title="إنجازاتي" desc="نقاط وشارات وسلسلة استمرارية تكافئ مواظبتك وتقدّمك." icon={Trophy}>
      <div className="grid grid-3">
        <Card tone="dark" className="card-dark level-card">
          <span className="kicker small" style={{ color: "var(--gold-300)" }}>المستوى</span>
          <div className="level-num num">{level}</div>
          <Progress value={(into / 500) * 100} tone="gold" size="lg" label="التقدّم للمستوى التالي" />
          <small style={{ color: "rgba(251,248,241,.7)" }}>{500 - into} نقطة للمستوى {level + 1}</small>
        </Card>
        <Stat label="إجمالي النقاط" value={points.toLocaleString("en-US")} icon={Award} tone="gold" foot="تُمنح تلقائيًّا على كل نشاط" />
        <Stat label="ترتيبي في الفصل" value={rank || "—"} unit={`من ${board.length}`} icon={Trophy} foot="بحسب النقاط" />
      </div>
      <Split className="mt">
        <div className="stack">
          <Card title="سلسلة التعلّم" kicker={`${streak} أيام متواصلة`}>
            <div className="streak-row">
              {days.map((d, i) => (
                <div key={d} className={cx("streak-day", i < Math.min(streak, 5) && "on")}><Flame size={20} /><small>{d}</small></div>
              ))}
            </div>
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
    </Page>
  );
}
