import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Avatar, cx } from "../../ui/Primitives";
import { useStore } from "../../store/StoreProvider";
import { childrenOf, smartAlerts, snapshot } from "../../store/selectors";

// اختيار الابن النشط (F5.1): التبديل السهل بين الأبناء يبقى بين صفحات وليّ الأمر
export function useChild() {
  const { state, user } = useStore();
  const kids = childrenOf(state, user.id);
  const [id, setId] = useState(() => {
    try {
      return sessionStorage.getItem("taqat-child") || kids[0]?.id;
    } catch {
      return kids[0]?.id;
    }
  });
  const select = (v) => {
    setId(v);
    try { sessionStorage.setItem("taqat-child", v); } catch { /* ignore */ }
  };
  const child = kids.find((k) => k.id === id) || kids[0];
  return { kids, child, select };
}

// مبدّل الأبناء: لكل ابن تبويب يحمل حالته (الإتقان والتنبيهات) من البيانات الفعلية، فيعرف وليّ الأمر أين ينظر أولًا.
export function ChildSwitcher({ kids, child, onSelect, compact }) {
  const { state } = useStore();
  return (
    <div className={cx("child-switch", compact && "compact")} role="tablist" aria-label="اختر الابن">
      {kids.map((k) => {
        const snap = snapshot(state, k.id);
        const alerts = smartAlerts(state, k.id).length;
        const on = child.id === k.id;
        return (
          <button key={k.id} role="tab" aria-selected={on} className={cx("child-tab", on && "active")} onClick={() => onSelect(k.id)}>
            <Avatar name={k.name} size={36} tone={on ? "gold" : undefined} />
            <span className="child-tab-copy">
              <strong>{k.name}</strong>
              <small>{k.className || k.grade}</small>
            </span>
            {!compact && (
              <span className="child-tab-state">
                <b className="num">{snap.entries.length ? `${snap.avg}%` : "—"}</b>
                {alerts ? (
                  <em className="is-alert"><AlertTriangle size={12} aria-hidden="true" /> {alerts} تنبيهات</em>
                ) : (
                  <em className="is-ok"><CheckCircle2 size={12} aria-hidden="true" /> لا تنبيهات</em>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
