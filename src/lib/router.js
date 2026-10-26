import { useCallback, useEffect, useState } from "react";

// مسار من نوع hash: #/page/param  — يحافظ على الصفحة عند التحديث ويسهّل المشاركة.
// الصفحات القانونية لها أيضًا مسارات حقيقية (/privacy/ و /terms/) تُولَّد ثابتة وقت البناء ليقرأها الزاحف.
const PATH_PAGES = { "/privacy": "privacy", "/terms": "terms" };
const trimSlash = (p) => p.replace(/\/+$/, "");

// عند التوليد المسبق على الخادم لا يوجد window: يحدّد سكربت البناء المسار هنا.
let serverPath = "/";
export const setServerPath = (p) => {
  serverPath = p;
};

const parse = () => {
  if (typeof window === "undefined") return { page: PATH_PAGES[trimSlash(serverPath)] || "", param: "" };
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (!raw) {
    const fromPath = PATH_PAGES[trimSlash(window.location.pathname)];
    if (fromPath) return { page: fromPath, param: "" };
  }
  const [page = "", ...rest] = raw.split("/").filter(Boolean);
  return { page, param: rest.join("/") };
};

// الصفحة الحالية دون React (لقرار البدء في main.jsx)
export const currentPage = () => parse().page;

export function useRoute(defaultPage) {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const go = useCallback((page, param) => {
    const next = `#/${page}${param ? `/${param}` : ""}`;
    // من صفحة قانونية (/privacy/) نعود إلى جذر الموقع مع المسار المطلوب
    if (window.location.pathname !== "/" && PATH_PAGES[trimSlash(window.location.pathname)]) {
      window.location.assign(`/${next}`);
      return;
    }
    if (window.location.hash === next) setRoute(parse());
    else window.location.hash = next;
    window.scrollTo({ top: 0 });
  }, []);
  return { page: route.page || defaultPage, param: route.param, go };
}
