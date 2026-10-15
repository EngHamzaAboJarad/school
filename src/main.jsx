// أوّلًا: نقل مفاتيح التخزين القديمة قبل أن تقرأها أي وحدة
import "./lib/migrateStorage";
import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import Root, { needsApp } from "./Root";
import { LangProvider, getLang } from "./i18n";
import { currentPage } from "./lib/router";
import "./styles/fonts.css";
import "./styles/theme.css";
import "./styles/tokens.css";
import "./styles/ui.css";
import "./styles/shell.css";
import "./styles/world.css";
import "./styles/landing.css";
// أنماط التطبيق الداخلي تُحمَّل مع حزمة App نفسها (src/App.jsx)

const tree = (
  <React.StrictMode>
    <LangProvider>
      <Root />
    </LangProvider>
  </React.StrictMode>
);

// الصفحة الرئيسية والصفحات القانونية مولَّدة مسبقًا بالعربية وقت البناء (scripts/prerender.mjs).
// نُكمل عليها (hydrate) إن كانت هي ما سيُعرض فعلًا؛ وإلا نرسم من جديد (دخول، إنجليزية، جلسة محفوظة).
const el = document.getElementById("root");
const prerendered = el.dataset.prerendered === "ar" && el.firstElementChild;
if (prerendered && getLang() === "ar" && !needsApp(currentPage())) hydrateRoot(el, tree);
else {
  el.textContent = "";
  createRoot(el).render(tree);
}
