import { useCallback, useEffect, useState } from "react";

// مسار من نوع hash: #/page/param  — يحافظ على الصفحة عند التحديث ويسهّل المشاركة.
const parse = () => {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [page = "", ...rest] = raw.split("/").filter(Boolean);
  return { page, param: rest.join("/") };
};

export function useRoute(defaultPage) {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const go = useCallback((page, param) => {
    const next = `#/${page}${param ? `/${param}` : ""}`;
    if (window.location.hash === next) setRoute(parse());
    else window.location.hash = next;
    window.scrollTo({ top: 0 });
  }, []);
  return { page: route.page || defaultPage, param: route.param, go };
}
