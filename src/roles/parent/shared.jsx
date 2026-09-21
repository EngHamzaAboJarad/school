import { useState } from "react";
import { Avatar, cx } from "../../ui/Primitives";
import { useStore } from "../../store/StoreProvider";
import { childrenOf } from "../../store/selectors";

// اختيار الابن النشط (F5.1): التبديل السهل بين الأبناء يبقى بين صفحات وليّ الأمر
export function useChild() {
  const { state, user } = useStore();
  const kids = childrenOf(state, user.id);
  const [id, setId] = useState(() => sessionStorage.getItem("taqat-child") || kids[0]?.id);
  const select = (v) => {
    setId(v);
    try { sessionStorage.setItem("taqat-child", v); } catch { /* ignore */ }
  };
  const child = kids.find((k) => k.id === id) || kids[0];
  return { kids, child, select };
}

export function ChildSwitcher({ kids, child, onSelect }) {
  return (
    <div className="child-switch" role="tablist" aria-label="اختر الابن">
      {kids.map((k) => (
        <button key={k.id} role="tab" aria-selected={child.id === k.id} className={cx("child-tab", child.id === k.id && "active")} onClick={() => onSelect(k.id)}>
          <Avatar name={k.name} size={40} tone={child.id === k.id ? "gold" : undefined} />
          <div><strong>{k.name}</strong><small>{k.grade}</small></div>
        </button>
      ))}
    </div>
  );
}
