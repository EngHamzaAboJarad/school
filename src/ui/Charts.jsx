import { cx } from "./Primitives";
import { CountUp } from "./motion";

export const masteryTone = (v) => (v == null ? "none" : v >= 85 ? "great" : v >= 70 ? "good" : v >= 55 ? "mid" : "low");

export function Ring({ value, size = 96, stroke = 9, label, sub, tone }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const t = tone || masteryTone(value);
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${label || "النسبة"} ${Math.round(value)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} className={`ring-fill ring-${t}`} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ "--c": c }}
        />
      </svg>
      <div className="ring-center">
        <b className="num"><CountUp value={Math.round(value)} duration={1100} /><small>%</small></b>
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

export function Bars({ data, height = 150, max = 100, unit = "" }) {
  return (
    <div className="bars" style={{ height }} role="img" aria-label="رسم أعمدة">
      {data.map((d, i) => (
        <div className="bar-col" key={i}>
          <span className="bar-val num">{d.value == null ? "—" : <CountUp value={`${d.value}${unit}`} />}</span>
          <div className="bar-track">
            <i className={cx("bar", `bar-${d.tone || masteryTone(d.value)}`, d.active && "active")} style={{ height: `${Math.max(3, ((d.value || 0) / max) * 100)}%` }} />
          </div>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HBars({ data, max = 100, unit = "%" }) {
  return (
    <div className="hbars">
      {data.map((d, i) => (
        <div className="hbar" key={i}>
          <div className="hbar-head">
            <span>{d.label}</span>
            <b className="num">{d.value == null ? "—" : <CountUp value={`${d.value}${unit}`} />}</b>
          </div>
          <div className="hbar-track">
            <i className={`bar-${d.tone || masteryTone(d.value)}`} style={{ width: `${((d.value || 0) / max) * 100}%` }} />
          </div>
          {d.sub && <small>{d.sub}</small>}
        </div>
      ))}
    </div>
  );
}

export function LineChart({ values, labels, height = 170, min = 40, max = 100, target }) {
  const W = 560;
  const H = height;
  const pad = { l: 32, r: 12, t: 12, b: 26 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i) => pad.l + (values.length === 1 ? iw / 2 : (i / (values.length - 1)) * iw);
  const y = (v) => pad.t + ih - ((v - min) / (max - min)) * ih;
  const pts = values.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${pad.t + ih} L${pts[0][0]},${pad.t + ih} Z`;
  const ticks = [min, (min + max) / 2, max];
  return (
    <svg className="linechart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="مخطّط التقدّم عبر الزمن" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold-400)" stopOpacity=".38" />
          <stop offset="1" stopColor="var(--gold-400)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="lc-grid" />
          <text x={pad.l - 6} y={y(t) + 4} className="lc-tick" textAnchor="end">{Math.round(t)}</text>
        </g>
      ))}
      {target != null && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} className="lc-target" />
          <text x={W - pad.r} y={y(target) - 5} className="lc-tick" textAnchor="end">الهدف {target}%</text>
        </g>
      )}
      <path d={area} fill="url(#lc-fill)" className="lc-area" />
      <path d={line} className="lc-line" fill="none" pathLength={1} />
      {pts.map((p, i) => (
        <g key={i}>
          {i === pts.length - 1 && <circle cx={p[0]} cy={p[1]} r={5} className="lc-ping" />}
          <circle cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 5 : 3.5} className={i === pts.length - 1 ? "lc-dot last" : "lc-dot"} style={{ "--k": i }} />
          {labels?.[i] && <text x={p[0]} y={H - 6} className="lc-tick" textAnchor="middle">{labels[i]}</text>}
        </g>
      ))}
    </svg>
  );
}

export function Heatmap({ cols, rows, onRowClick }) {
  return (
    <div className="heatmap" style={{ "--cols": cols.length }}>
      <div className="hm-row hm-head">
        <span />
        {cols.map((c) => (
          <span key={c.id} title={c.title} className="hm-col">{c.label}</span>
        ))}
      </div>
      {rows.map((r) => (
        <div className={cx("hm-row", onRowClick && "clickable")} key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined}>
          <span className="hm-name">{r.label}</span>
          {r.cells.map((v, i) => (
            <span key={i} className={cx("hm-cell", `hm-${masteryTone(v)}`)} title={v == null ? "لم يُقيَّم" : `${v}%`}>
              <b className="num">{v == null ? "—" : v}</b>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Legend() {
  return (
    <div className="legend">
      {[["great", "متقن ≥85"], ["good", "جيد 70–84"], ["mid", "يحتاج دعمًا 55–69"], ["low", "فجوة <55"], ["none", "لم يُقيَّم"]].map(([t, l]) => (
        <span key={t}><i className={`hm-${t}`} />{l}</span>
      ))}
    </div>
  );
}

export function Spark({ values, tone = "gold" }) {
  const W = 90, H = 30;
  const min = Math.min(...values), max = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - 3 - ((v - min) / (max - min || 1)) * (H - 6)}`).join(" ");
  return (
    <svg className={`spark spark-${tone}`} viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      <polyline points={pts} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
    </svg>
  );
}
