// Cloudflare Worker مرجعي لاستقبال طلبات التواصل من الصفحة الرئيسية وتقديم ملفات الموقع.
// يخدم الملفات الثابتة من dist (ASSETS)، ويستقبل POST /api/leads ويحفظ الطلب في KV (LEADS).
// الإعداد والنشر: docs/deploy/README.md
//
// الحقول المقبولة (من src/lib/leads.js): name, contact, org, kind, message, page, lang

const MAX = { name: 120, contact: 120, org: 160, kind: 80, message: 600 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^(?:\+?966|0)?5\d{8}$/;
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const latin = (v) => v.replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d)).replace(/[\s-]/g, "");

export async function handleLead(request, env) {
  if (request.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json(415, { error: "json_only" });
  // نفس الأصل فقط: يرفض الإرسال من مواقع أخرى
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return json(403, { error: "cross_origin" });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "bad_json" });
  }
  const lead = {
    name: clean(body.name, MAX.name),
    contact: clean(body.contact, MAX.contact),
    org: clean(body.org, MAX.org),
    kind: clean(body.kind, MAX.kind),
    message: clean(body.message, MAX.message),
    lang: body.lang === "en" ? "en" : "ar",
  };
  if (!lead.name || !lead.contact) return json(422, { error: "missing_fields" });
  if (!EMAIL.test(lead.contact) && !PHONE.test(latin(lead.contact))) return json(422, { error: "bad_contact" });

  // حدّ بسيط: ٥ طلبات في الساعة لكل عنوان IP
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rateKey = `rate:${ip}:${new Date().toISOString().slice(0, 13)}`;
  const count = Number((await env.LEADS.get(rateKey)) || 0);
  if (count >= 5) return json(429, { error: "too_many_requests" });
  await env.LEADS.put(rateKey, String(count + 1), { expirationTtl: 3600 });

  const at = new Date().toISOString();
  const id = `lead:${at}:${crypto.randomUUID().slice(0, 8)}`;
  await env.LEADS.put(id, JSON.stringify({ ...lead, at }));
  return json(201, { ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/leads") return handleLead(request, env);
    return env.ASSETS.fetch(request);
  },
};
