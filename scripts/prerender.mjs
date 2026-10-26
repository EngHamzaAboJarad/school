// يعمل بعد «vite build» و«vite build --ssr»: يحقن HTML المولَّد مسبقًا في dist، ويضيف بيانات المشاركة
// (Open Graph) والبيانات المنظَّمة (JSON-LD)، ويكتب robots.txt و sitemap.xml و _headers.
//
// SITE_URL: العنوان العام للموقع (للروابط المطلقة في المعاينة وخريطة الموقع). غيّره عند الانتقال إلى نطاق خاص:
//   SITE_URL=https://mushriq.sa npm run build
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(process.env.OUT_DIR || join(root, "dist"));
const ssrDir = resolve(process.env.SSR_DIR || join(root, "dist-ssr"));
const SITE_URL = (process.env.SITE_URL || "https://school.flutter-dart-2021-new.workers.dev").replace(/\/+$/, "");
const LEADS = (process.env.VITE_LEADS_ENDPOINT || "").trim();

const { render, FAQ, legalDoc } = await import(pathToFileURL(join(ssrDir, "entry-server.js")).href);
const template = readFileSync(join(dist, "index.html"), "utf8");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

const HOME_TITLE = "مشرق | مدرسة رقمية عربية بالذكاء الاصطناعي";
const HOME_DESC = "يشرح مشرق كل درس ويلخّصه ويختبره، ثم يبني لكل طالب خطة حتى الإتقان، والمعلّم يعتمد كل خطوة.";

const pages = [
  {
    path: "/",
    out: "index.html",
    title: HOME_TITLE,
    desc: HOME_DESC,
    ld: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "مشرق",
        alternateName: "Mushriq",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icon-512.png`,
        description: HOME_DESC,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: "ar",
        mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      },
    ],
  },
  { path: "/privacy/", out: "privacy/index.html", title: `${legalDoc("privacy", "ar").title} | مشرق`, desc: "كيف يجمع مشرق البيانات ويستخدمها ويحميها، وحقوقك فيها." },
  { path: "/terms/", out: "terms/index.html", title: `${legalDoc("terms", "ar").title} | مشرق`, desc: "شروط استخدام منصّة مشرق التعليمية." },
];

for (const p of pages) {
  const url = `${SITE_URL}${p.path}`;
  // React 19 يضع روابط preload للصور في بداية المخرجات؛ مكانها الصحيح <head> ليبدأ تنزيل صورة البطل مبكرًا
  const preloads = [];
  const body = render(p.path).replace(/^(?:<link rel="preload"[^>]*\/>)+/, (m) => {
    preloads.push(...m.match(/<link[^>]*\/>/g).map((l) => l.replace("fetchPriority", "fetchpriority")));
    return "";
  });
  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE_URL}/og-image.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="مشرق: مدرسة رقمية عربية بالذكاء الاصطناعي" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...(p.ld || []).map(jsonLd),
  ].join("\n    ");
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(p.desc)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(p.title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${esc(p.desc)}$2`)
    .replace("</head>", () => `    ${[...preloads, head].join("\n    ")}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root" data-prerendered="ar">${body}</div>`);
  const file = join(dist, p.out);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log(`prerendered ${p.path} → ${p.out} (${Math.round(html.length / 1024)} KB)`);
}

writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${SITE_URL}${p.path}</loc></url>`).join("\n")}\n</urlset>\n`,
);

// ترويسات Cloudflare (Workers Static Assets / Pages): تخزين دائم للأصول المُهشّمة، وترويسات الأمان.
// بصمة السكربت المضمَّن في index.html تُحسب هنا حتى يسمح به CSP دون 'unsafe-inline'.
const inline = [...template.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`);
const connect = ["'self'"];
if (/^https?:\/\//.test(LEADS)) connect.push(new URL(LEADS).origin);
const csp = [
  "default-src 'self'",
  `script-src 'self' ${inline.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src ${connect.join(" ")}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
writeFileSync(
  join(dist, "_headers"),
  `/assets/*
  Cache-Control: public, max-age=31536000, immutable

/landing/*
  Cache-Control: public, max-age=604800

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  X-Frame-Options: DENY
  Content-Security-Policy: ${csp}
`,
);

rmSync(ssrDir, { recursive: true, force: true });
console.log(`robots.txt, sitemap.xml, _headers written (SITE_URL=${SITE_URL})`);
