import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Inbox, AlertOctagon, ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, Minus, CheckCircle2, AlertTriangle, Info, Clock3 } from "lucide-react";
import { initials } from "../lib/format";
import { CountUp } from "./motion";

export const cx = (...a) => a.filter(Boolean).join(" ");

export function Btn({ variant = "soft", size, icon: Icon, iconEnd: IconEnd, children, className, type = "button", ...rest }) {
  return (
    <button type={type} className={cx("btn", `btn-${variant}`, size && `btn-${size}`, !children && "btn-icon", className)} {...rest}>
      {Icon && <Icon size={size === "sm" ? 15 : 17} />}
      {children}
      {IconEnd && <IconEnd size={size === "sm" ? 15 : 17} />}
    </button>
  );
}

// kicker/icon مقبولان للتوافق لكنهما لا يُعرضان: مسار التنقّل في الشريط العلوي يحمل القسم، والعنوان يكفي وحده.
// eslint-disable-next-line no-unused-vars
export function Page({ kicker, title, desc, actions, children, icon: Icon, className }) {
  return (
    <div className={cx("page", className)}>
      {title && <header className="page-head">
        <div className="page-head-copy">
          <h1>{title}</h1>
          {desc && <p>{desc}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </header>}
      {children}
    </div>
  );
}

export function Card({ title, kicker, action, children, className, flush, tone, ...rest }) {
  return (
    <section className={cx("card", flush && "flush", tone && `card-${tone}`, className)} {...rest}>
      {(title || kicker || action) && (
        <div className="card-head">
          <div style={{ minWidth: 0 }}>
            {title ? <h3>{title}</h3> : kicker && <h3>{kicker}</h3>}
            {title && kicker && <p className="card-sub">{kicker}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, unit, foot, icon: Icon, tone = "emerald", ring }) {
  return (
    <div className={cx("stat", `stat-${tone}`)}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className="stat-icon">
            <Icon size={17} />
          </span>
        )}
      </div>
      <div className="stat-value num">
        {unit === "%" ? <span><CountUp value={value} /><small>%</small></span> : <><CountUp value={value} />{unit && <small>{unit}</small>}</>}
      </div>
      {foot && <div className="stat-foot">{foot}</div>}
      {ring}
    </div>
  );
}

export function Badge({ tone = "neutral", children, dot, icon: Icon }) {
  return (
    <span className={cx("badge", `badge-${tone}`)}>
      {dot && <i />}
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cx("tabs", className)} role="tablist">
      {tabs.map(({ id, label, icon: Icon, count }) => (
        <button key={id} role="tab" aria-selected={value === id} className={cx("tab", value === id && "active")} onClick={() => onChange(id)}>
          {Icon && <Icon size={16} />}
          {label}
          {count !== undefined && count > 0 && <b className="tab-count">{count}</b>}
        </button>
      ))}
    </div>
  );
}

export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cx("segmented", className)} role="radiogroup">
      {options.map((o) => {
        const opt = typeof o === "string" ? { id: o, label: o } : o;
        return (
          <button key={opt.id} role="radio" aria-checked={value === opt.id} className={value === opt.id ? "active" : ""} onClick={() => onChange(opt.id)}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({ open, onClose, title, kicker, children, footer, wide, drawer, size }) {
  const id = useId();
  const box = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    // التركيز داخل النافذة عند فتحها (ما لم يأخذه حقل بـ autoFocus) وحصر Tab داخلها
    if (box.current && !box.current.contains(document.activeElement)) box.current.focus();
    const onKey = (e) => {
      if (e.key === "Escape") return closeRef.current();
      if (e.key !== "Tab" || !box.current) return;
      const f = [...box.current.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (prev && typeof prev.focus === "function" && document.contains(prev)) prev.focus();
    };
  }, [open]);
  if (!open) return null;
  // يُرسم على <body> مباشرة كي لا يتقيّد بأي أب عليه transform/animation (كان يقصّ النافذة ويمنع السكرول)
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} tabIndex={-1} className={cx("modal", wide && "wide", drawer && "drawer", size)} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="modal-head">
          <div>
            <h3 id={id}>{title}</h3>
            {kicker && <p className="card-sub">{kicker}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx("field", className)}>
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export const Input = (p) => <input {...p} className={cx("input", p.className)} />;
export const Select = ({ children, ...p }) => (
  <select {...p} className={cx("input select", p.className)}>
    {children}
  </select>
);
export const Textarea = (p) => <textarea {...p} className={cx("input textarea", p.className)} />;

export function Toggle({ checked, onChange, label, disabled, hint }) {
  return (
    <label className={cx("toggle", disabled && "disabled")}>
      <span className="toggle-copy">
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

export function Progress({ value, tone = "emerald", size, label }) {
  return (
    <div className={cx("progress", size && `progress-${size}`)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <i className={`fill-${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Avatar({ name, size = 38, tone, src }) {
  return (
    <span className={cx("avatar", tone && `avatar-${tone}`)} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }} /> : initials(name)}
    </span>
  );
}

export function Empty({ icon: Icon = Inbox, title, desc, action, compact }) {
  return (
    <div className={cx("empty", compact && "compact")}>
      <span className="empty-icon">
        <Icon size={24} />
      </span>
      <strong>{title}</strong>
      {desc && <p>{desc}</p>}
      {action}
    </div>
  );
}

export function ListRow({ icon: Icon, tone = "emerald", title, meta, end, onClick, children, active, avatar }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={cx("list-row", onClick && "clickable", active && "active")} onClick={onClick}>
      {avatar ? <Avatar name={avatar} tone={tone} /> : Icon && (
        <span className={cx("row-icon", `tone-${tone}`)}>
          <Icon size={18} />
        </span>
      )}
      <div className="row-main">
        <strong>{title}</strong>
        {meta && <span>{meta}</span>}
        {children}
      </div>
      {end && <div className="row-end">{end}</div>}
    </Tag>
  );
}

export function Notice({ tone = "info", title, children, icon: Icon, action }) {
  return (
    <div className={cx("notice", `notice-${tone}`)}>
      {Icon && <Icon size={18} />}
      <div>
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}

// جدول بيانات: على الجوال (≤640px) تتحوّل الصفوف إلى بطاقات بعناوين الأعمدة (mobile="cards")،
// وpageSize يفعّل ترقيم الصفحات. العمود ذو primary يتصدّر البطاقة.
export function DataTable({ columns, rows, onRowClick, empty = "لا توجد بيانات", dense, mobile = "cards", pageSize, caption }) {
  const pg = usePagination(rows, pageSize || rows.length || 1);
  if (!rows.length) return typeof empty === "string" ? <Empty compact title={empty} /> : empty;
  const shown = pageSize ? pg.items : rows;
  return (
    <>
      <div className="table-wrap">
        <table className={cx("table", dense && "dense", mobile === "cards" && "cards-sm")}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" style={{ width: c.width, textAlign: c.align }}>
                  {c.label || <span className="sr-only">{c.srLabel || "إجراءات"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={r.id ?? i} className={onRowClick ? "clickable" : ""} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                {columns.map((c) => (
                  <td key={c.key} data-label={c.primary ? "" : c.label || ""} className={cx(c.primary && "is-primary", c.num && "is-num")} style={{ textAlign: c.align }}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageSize && rows.length > pageSize && <Pagination {...pg} />}
    </>
  );
}

// ───── ترقيم الصفحات ─────
export function usePagination(rows, pageSize = 10) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages);
  const items = useMemo(() => rows.slice((cur - 1) * pageSize, cur * pageSize), [rows, cur, pageSize]);
  return { page: cur, pages, setPage, items, total: rows.length, from: rows.length ? (cur - 1) * pageSize + 1 : 0, to: Math.min(cur * pageSize, rows.length) };
}

export function Pagination({ page, pages, setPage, total, from, to }) {
  if (pages <= 1) return null;
  const nums = pages <= 7 ? Array.from({ length: pages }, (_, i) => i + 1) : [...new Set([1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages))];
  return (
    <nav className="pagination" aria-label="ترقيم الصفحات">
      <span>
        <span className="num">{from}–{to}</span> من <span className="num">{total}</span>
      </span>
      <div className="row">
        <Btn size="sm" variant="ghost" icon={ChevronRight} disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="الصفحة السابقة" />
        {nums.map((n, i) => (
          <span key={n} className="row" style={{ gap: 4 }}>
            {i > 0 && n - nums[i - 1] > 1 && <span aria-hidden="true">…</span>}
            <Btn size="sm" variant="ghost" className="btn-icon" aria-current={n === page ? "page" : undefined} onClick={() => setPage(n)}>
              <span className="num">{n}</span>
            </Btn>
          </span>
        ))}
        <Btn size="sm" variant="ghost" icon={ChevronLeft} disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="الصفحة التالية" />
      </div>
    </nav>
  );
}

export const Grid = ({ cols = 4, children, className }) => <div className={cx("grid", `grid-${cols}`, className)}>{children}</div>;
export const Split = ({ children, className, wide }) => <div className={cx("split", wide && "split-wide", className)}>{children}</div>;

export function SearchBox({ value, onChange, placeholder = "بحث…", className }) {
  return (
    <div className={cx("searchbox", className)} role="search">
      <Search size={16} aria-hidden="true" />
      <input className="input" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

// ───── مكوّنات نظام التصميم الجديدة ─────

// رأس قسم مضغوط داخل البطاقات أو بين أقسام الصفحة
export function SectionHeader({ title, desc, action, as: H = "h2", id }) {
  return (
    <div className="section-head">
      <div style={{ minWidth: 0 }}>
        <H id={id}>{title}</H>
        {desc && <p>{desc}</p>}
      </div>
      {action}
    </div>
  );
}

// بطاقة مؤشّر: القيمة تأتي من البيانات فقط؛ value=null يعرض حالة «لا بيانات» بدل رقم مختلَق.
// delta: { value, label, good: "up"|"down" } — الاتجاه يُكتب نصًّا ورمزًا لا لونًا فقط.
export function MetricCard({ label, value, unit, foot, icon: Icon, delta, meter, tone, emptyText = "لا بيانات بعد", onClick, loading }) {
  const Tag = onClick ? "button" : "div";
  const edge = tone === "warn" ? "tone-warn-edge" : tone === "danger" ? "tone-danger-edge" : "";
  let d = null;
  if (delta && delta.value != null) {
    const dir = delta.value > 0 ? "up" : delta.value < 0 ? "down" : "flat";
    const cls = dir === "flat" ? "flat" : dir === (delta.good || "up") ? "good" : "bad";
    const DIcon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus;
    d = (
      <span className={cx("metric-delta", cls)}>
        <DIcon size={13} aria-hidden="true" />
        <span className="num">{dir === "flat" ? "0" : `${Math.abs(delta.value)}${delta.unit ?? ""}`}</span>
        <span className="sr-only">{dir === "up" ? "ارتفاع" : dir === "down" ? "انخفاض" : "دون تغيير"}</span>
      </span>
    );
  }
  return (
    <Tag className={cx("metric", edge)} onClick={onClick} type={onClick ? "button" : undefined}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        {Icon && <span className={cx("metric-icon", tone && `tone-${tone}`)}><Icon size={17} aria-hidden="true" /></span>}
      </div>
      {loading ? (
        <Skeleton style={{ height: 28, width: "55%", marginTop: 10 }} />
      ) : value == null ? (
        <div className="metric-value is-empty">{emptyText}</div>
      ) : (
        <div className="metric-value">
          {unit === "%" ? (
            <span className="num">{value}<small>%</small></span>
          ) : (
            <>
              <span className="num">{value}</span>
              {unit && <small>{unit}</small>}
            </>
          )}
        </div>
      )}
      {(d || foot) && <div className="metric-foot">{d}{d && delta.label && <span>{delta.label}</span>}{foot && <span>{foot}</span>}</div>}
      {meter != null && <div className="metric-meter"><Progress value={meter.value} tone={meter.tone || "brand"} size="sm" label={meter.label || label} /></div>}
    </Tag>
  );
}

// شارة حالة: لون + أيقونة + نص دائمًا (لا يعتمد على اللون وحده)
const STATUS_ICON = { success: CheckCircle2, warn: Clock3, danger: AlertTriangle, info: Info, neutral: null, gold: null };
export function StatusBadge({ tone = "neutral", children, icon }) {
  const I = icon === undefined ? STATUS_ICON[tone] : icon;
  return <Badge tone={tone} icon={I || undefined}>{children}</Badge>;
}

export function Skeleton({ style, className, lines }) {
  if (lines) return <div className="stack-sm" aria-hidden="true">{Array.from({ length: lines }, (_, i) => <span key={i} className="skeleton" style={{ height: 12, width: `${90 - i * 12}%` }} />)}</div>;
  return <span className={cx("skeleton", className)} style={style} aria-hidden="true" />;
}

export function ErrorState({ title = "تعذّر تحميل البيانات", desc = "حدث خطأ غير متوقّع. حاول مرة أخرى.", onRetry }) {
  return (
    <div className="empty error-state" role="alert">
      <span className="empty-icon"><AlertOctagon size={20} /></span>
      <strong>{title}</strong>
      {desc && <p>{desc}</p>}
      {onRetry && <Btn size="sm" variant="ghost" onClick={onRetry}>إعادة المحاولة</Btn>}
    </div>
  );
}

// قائمة منسدلة: زر يفتح قائمة إجراءات؛ تُغلق بـ Esc أو بالنقر خارجها، وتُدار بالأسهم.
export function Menu({ label, icon: Icon, items, variant = "ghost", size = "sm", align, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const wrap = useRef(null);
  const listRef = useRef(null);
  const menuId = useId();
  // موضع ثابت محسوب من الزر كي لا تقصّ القائمةَ الحاوياتُ القابلة للتمرير (مثل الجداول)
  const toggle = () => {
    if (!open && wrap.current) {
      const r = wrap.current.getBoundingClientRect();
      const rtl = document.documentElement.dir !== "ltr";
      const up = align === "up" || r.bottom + 240 > window.innerHeight;
      setPos({
        position: "fixed",
        ...(up ? { bottom: window.innerHeight - r.top + 4, top: "auto" } : { top: r.bottom + 4 }),
        ...(rtl ? { left: Math.max(8, r.left), right: "auto" } : { right: Math.max(8, window.innerWidth - r.right), left: "auto" }),
      });
    }
    setOpen((o) => !o);
  };
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => !wrap.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key === "Escape") { setOpen(false); wrap.current?.querySelector("button")?.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const list = [...(listRef.current?.querySelectorAll(".menu-item:not(:disabled)") || [])];
        const i = list.indexOf(document.activeElement);
        list[(i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]?.focus();
      }
    };
    const onMove = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    listRef.current?.querySelector(".menu-item")?.focus();
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);
  return (
    <div className="menu-wrap" ref={wrap}>
      <Btn variant={variant} size={size} icon={Icon} aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} aria-label={children ? undefined : label} onClick={toggle}>
        {children}
      </Btn>
      {open && (
        <div className="menu" role="menu" id={menuId} ref={listRef} style={pos || undefined}>
          {items.filter(Boolean).map((it, i) => it === "sep" ? <div key={i} className="menu-sep" role="separator" /> : (
            <button key={it.label} role="menuitem" className={cx("menu-item", it.danger && "danger")} disabled={it.disabled} onClick={() => { setOpen(false); it.onClick(); }}>
              {it.icon && <it.icon size={16} aria-hidden="true" />}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
