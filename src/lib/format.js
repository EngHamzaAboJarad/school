const LOCALE = "ar-SA-u-ca-gregory-nu-latn";

export const fmtDate = (ts, opts = { day: "numeric", month: "long" }) =>
  new Intl.DateTimeFormat(LOCALE, opts).format(ts);

export const fmtLongDate = (ts = Date.now()) =>
  fmtDate(ts, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const fmtTime = (ts) =>
  new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit" }).format(ts);

export const fmtNum = (n) => new Intl.NumberFormat("en-US").format(n);

export const pct = (n) => `${Math.round(n)}%`;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function timeAgo(ts, now = Date.now()) {
  const d = now - ts;
  if (d < MIN) return "الآن";
  if (d < HOUR) {
    const m = Math.floor(d / MIN);
    return m === 1 ? "منذ دقيقة" : m === 2 ? "منذ دقيقتين" : m <= 10 ? `منذ ${m} دقائق` : `منذ ${m} دقيقة`;
  }
  if (d < DAY) {
    const h = Math.floor(d / HOUR);
    return h === 1 ? "منذ ساعة" : h === 2 ? "منذ ساعتين" : h <= 10 ? `منذ ${h} ساعات` : `منذ ${h} ساعة`;
  }
  const days = Math.floor(d / DAY);
  if (days === 1) return "أمس";
  if (days < 7) return days === 2 ? "منذ يومين" : `منذ ${days} أيام`;
  return fmtDate(ts);
}

export function daysFromNow(ts, now = Date.now()) {
  const start = (t) => new Date(new Date(t).setHours(0, 0, 0, 0)).getTime();
  return Math.round((start(ts) - start(now)) / DAY);
}

export function relativeDay(ts) {
  const d = daysFromNow(ts);
  if (d === 0) return "اليوم";
  if (d === 1) return "غدًا";
  if (d === -1) return "أمس";
  if (d === 2) return "بعد يومين";
  if (d > 2 && d < 8) return `بعد ${d} أيام`;
  return fmtDate(ts);
}

export const DAY_MS = DAY;
export const HOUR_MS = HOUR;
export const MIN_MS = MIN;

export const initials = (name = "") => {
  const clean = name.replace(/^(أ\.|د\.|م\.)\s*/, "").trim();
  return clean.charAt(0) || "؟";
};

export const toneOf = (value) =>
  value >= 85 ? "success" : value >= 70 ? "info" : value >= 55 ? "warn" : "danger";

export const levelLabel = (value) =>
  value >= 85 ? "متقن" : value >= 70 ? "جيد" : value >= 55 ? "يحتاج دعمًا" : "فجوة";
