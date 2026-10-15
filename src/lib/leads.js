// إرسال طلبات التواصل من الصفحة الرئيسية.
//
// الإرسال الحقيقي: عرّف VITE_LEADS_ENDPOINT وقت البناء (مثل /api/leads) فيُرسَل الطلب
// بـ POST كـ JSON، ويظهر للزائر خطأ واضح إن فشل. مثال جاهز للخادم: docs/deploy/leads-worker.js
//
// بلا عنوان خادم (نسخة العرض الحالية): لا نَعِد الزائر بشيء لم يحدث. يُحفظ الطلب في صندوق
// محلي يقرؤه مخزن التطبيق عند فتحه، فيظهر في لوحة مدير النظام التجريبية «الطلبات الواردة».

const ENDPOINT = (import.meta.env.VITE_LEADS_ENDPOINT || "").trim();
const INBOX_KEY = "mushriq-leads-inbox";
const TIMEOUT_MS = 12000;

export const leadsAreLive = ENDPOINT.length > 0;

export async function submitLead(lead) {
  if (!leadsAreLive) {
    try {
      const inbox = JSON.parse(localStorage.getItem(INBOX_KEY) || "[]");
      inbox.push({ ...lead, id: `LD-${Date.now().toString(36)}` });
      localStorage.setItem(INBOX_KEY, JSON.stringify(inbox));
    } catch {
      /* التخزين غير متاح: لا شيء يُحفظ، والرسالة للزائر تبقى صادقة */
    }
    return { delivered: false };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, page: "landing", lang: document.documentElement.lang || "ar" }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { delivered: true };
  } finally {
    clearTimeout(timer);
  }
}

// يُستدعى عند تحميل مخزن التطبيق: يعيد طلبات نسخة العرض ويفرّغ الصندوق. القائمة تُحفظ للجلسة
// لأن React قد يستدعي مُهيّئ الحالة مرّتين؛ والمخزن يتجاهل أي طلب موجود مسبقًا بالمعرّف نفسه.
let drained = null;
export function drainLeadInbox() {
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    localStorage.removeItem(INBOX_KEY);
    const list = raw ? JSON.parse(raw) : [];
    drained = [...(drained || []), ...(Array.isArray(list) ? list : [])];
  } catch {
    drained = drained || [];
  }
  return drained;
}
