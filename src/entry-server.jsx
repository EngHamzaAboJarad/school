// مدخل التوليد المسبق (SSR وقت البناء فقط): يرسم الصفحة الرئيسية والصفحات القانونية بالعربية
// إلى HTML ثابت، فيرى الزائر المحتوى فورًا ويقرؤه الزاحف ومعاينة الروابط. انظر scripts/prerender.mjs
import React from "react";
import { renderToString } from "react-dom/server";
import Root from "./Root";
import { LangProvider } from "./i18n";
import { setServerPath } from "./lib/router";

export function render(path) {
  setServerPath(path);
  // الشجرة نفسها التي يبنيها main.jsx حتى تتطابق المعرّفات (useId) عند الإكمال في المتصفح
  return renderToString(
    <React.StrictMode>
      <LangProvider>
        <Root />
      </LangProvider>
    </React.StrictMode>,
  );
}

export { FAQ } from "./marketing/content";
export { legalDoc } from "./marketing/legal";
