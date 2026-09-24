import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, Fragment } from "react";
import en from "./en.json";
import enExtra from "./en.extra.json";

// ──────────────────────────────────────────────────────────────────────────
// الترجمة العربية ↔ الإنجليزية
// الواجهة تُكتب بالعربية، وعند اختيار English يُترجم كل نص ظاهر (وسمات placeholder/aria-label/title)
// عبر قاموس + قوالب للنصوص ذات الأرقام والأسماء. محتوى الدروس ونصوص الأسئلة يبقى عربيًّا
// لأنه منهج عربي. منطق التطبيق لا يتأثر لأن الترجمة تقع على النص المعروض فقط.
// ──────────────────────────────────────────────────────────────────────────

export const LANG_KEY = "taqat-lang";
const AR = /[؀-ۿ]/;

const readLang = () => {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
};
let current = readLang();
export const getLang = () => current;
export const isEn = () => current === "en";

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exact = new Map();
const templates = [];
// الالتقاط لا يعبر الفواصل « • » و« — » حتى لا تلتصق قوالب على قوائم طويلة
const CAP = "((?:(?! • | — ).)+?)";
function register(k, v) {
  if (k.includes("{}")) templates.push({ re: new RegExp(`^${k.split("{}").map(escapeRe).join(CAP)}$`), out: v, len: k.length });
  else exact.set(k, v);
}
for (const [k, v] of Object.entries({ ...en, ...enExtra })) {
  register(k, v);
  // نسخة بلا الرصاصة «• » لأن التقسيم على « • » يفصلها عن النص
  if (k.startsWith("• ")) register(k.slice(2), v.replace(/^•\s*/, ""));
}
templates.sort((a, b) => b.len - a.len);

const SPLITS = [
  [" • ", " • "],
  [" — ", " — "],
  ["، ", ", "],
  [" | ", " | "],
];

const cache = new Map();

function fill(out, groups) {
  let i = 0;
  return out.replace(/\{(\d*)\}/g, (_, n) => {
    const g = n ? groups[Number(n) - 1] : groups[i++];
    return translate(g ?? "");
  });
}

function lookup(core) {
  if (!AR.test(core)) return core;
  if (cache.has(core)) return cache.get(core);
  let res = exact.get(core) ?? null;
  if (res === null) {
    for (const t of templates) {
      const m = core.match(t.re);
      if (m) {
        res = fill(t.out, m.slice(1));
        break;
      }
    }
  }
  if (res === null) {
    // نص ينتهي برقم/نسبة: نترجم الرأس ونُبقي الرقم (مثل «الميل 58%»)
    const m = core.match(/^(.*\S)\s+([\d.,]+%?)$/);
    if (m) {
      const head = lookup(m[1]);
      if (head !== null && head !== m[1]) res = `${head} ${m[2]}`;
    }
  }
  if (res === null) {
    for (const [sep, join] of SPLITS) {
      if (core.includes(sep)) {
        const parts = core.split(sep).map((p) => lookup(p) ?? p);
        const changed = parts.some((p, i) => p !== core.split(sep)[i]);
        if (changed) {
          res = parts.join(join);
          break;
        }
      }
    }
  }
  cache.set(core, res);
  return res;
}

// يترجم نصًّا مع الحفاظ على المسافات المحيطة؛ يعيد الأصل إن لم يجد ترجمة.
export function translate(text) {
  if (!text || !AR.test(text)) return text;
  const lead = text.match(/^\s*/)[0];
  const trail = text.match(/\s*$/)[0];
  const core = text.trim().replace(/\s+/g, " ");
  const r = lookup(core);
  return r == null ? text : lead + r + trail;
}

// t(): للنصوص المُنشأة في JavaScript وتظهر خارج DOM (مثل document.title أو تنزيل ملف).
export const t = (text) => (current === "en" ? translate(text) : text);

// ───── المترجم الحيّ للـDOM ─────
const ATTRS = ["placeholder", "aria-label", "title", "alt"];
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT"]);

const skipped = (el) => !el || SKIP_TAGS.has(el.tagName) || !!el.closest?.("[data-notr]");

function translateNode(n) {
  if (n.nodeType === 3) {
    const v = n.nodeValue;
    if (!AR.test(v) || skipped(n.parentElement)) return;
    const r = translate(v);
    if (r !== v) n.nodeValue = r;
  } else if (n.nodeType === 1) {
    if (n.closest("[data-notr]")) return;
    for (const a of ATTRS) {
      const v = n.getAttribute(a);
      if (v && AR.test(v)) {
        const r = translate(v);
        if (r !== v) n.setAttribute(a, r);
      }
    }
  }
}

function walk(root) {
  translateNode(root);
  if (root.nodeType !== 1 || skipped(root)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n = w.nextNode();
  while (n) {
    translateNode(n);
    n = w.nextNode();
  }
}

function startTranslator() {
  walk(document.body);
  document.title = translate(document.title);
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "childList") m.addedNodes.forEach((n) => walk(n));
      else if (m.type === "characterData") translateNode(m.target);
      else if (m.type === "attributes") translateNode(m.target);
    }
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  const titleObs = new MutationObserver(() => {
    const r = translate(document.title);
    if (r !== document.title) document.title = r;
  });
  const titleEl = document.querySelector("title");
  if (titleEl) titleObs.observe(titleEl, { childList: true, characterData: true, subtree: true });
  return () => {
    obs.disconnect();
    titleObs.disconnect();
  };
}

// ───── المزوّد وزر التبديل ─────
const Ctx = createContext({ lang: "ar", setLang: () => {} });
export const useLang = () => useContext(Ctx);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(current);
  const setLang = useCallback((l) => {
    current = l;
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
    setLangState(l);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
    if (lang === "en") return startTranslator();
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  // إعادة تركيب الشجرة عند تبديل اللغة حتى تُبنى النصوص من جديد بالغة المختارة (الحالة محفوظة في المخزن)
  return (
    <Ctx.Provider value={value}>
      <Fragment key={lang}>{children}</Fragment>
    </Ctx.Provider>
  );
}
