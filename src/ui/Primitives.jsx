import { useEffect, useId } from "react";
import { X, Inbox } from "lucide-react";
import { initials } from "../lib/format";

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

export function Page({ kicker, title, desc, actions, children, icon: Icon, className }) {
  return (
    <div className={cx("page", className)}>
      {title && <header className="page-head">
        <div className="page-head-copy">
          {kicker && (
            <span className="kicker">
              {Icon && <Icon size={14} />} {kicker}
            </span>
          )}
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
          <div>
            {kicker && <span className="kicker small">{kicker}</span>}
            {title && <h3>{title}</h3>}
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
        {value}
        {unit && <small>{unit}</small>}
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

export function Modal({ open, onClose, title, kicker, children, footer, wide, drawer }) {
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modal", wide && "wide", drawer && "drawer")} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="modal-head">
          <div>
            {kicker && <span className="kicker small">{kicker}</span>}
            <h3 id={id}>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
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

export function Avatar({ name, size = 38, tone }) {
  return (
    <span className={cx("avatar", tone && `avatar-${tone}`)} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Empty({ icon: Icon = Inbox, title, desc, action }) {
  return (
    <div className="empty">
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

export function DataTable({ columns, rows, onRowClick, empty = "لا توجد بيانات", dense }) {
  if (!rows.length) return <Empty title={empty} />;
  return (
    <div className="table-wrap">
      <table className={cx("table", dense && "dense")}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className={onRowClick ? "clickable" : ""} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align }}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Grid = ({ cols = 4, children, className }) => <div className={cx("grid", `grid-${cols}`, className)}>{children}</div>;
export const Split = ({ children, className, wide }) => <div className={cx("split", wide && "split-wide", className)}>{children}</div>;

export function SearchBox({ value, onChange, placeholder = "بحث…" }) {
  return (
    <div className="searchbox">
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}
