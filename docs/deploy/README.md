# النشر على Cloudflare

## البناء

```bash
npm install
SITE_URL=https://<النطاق> npm run build
```

`npm run build` يشغّل ثلاث خطوات:

1. `vite build`: حزم المتصفح في `dist/`.
2. `vite build --ssr src/entry-server.jsx`: نسخة خادم مؤقتة في `dist-ssr/` (تُحذف بعد الخطوة الثالثة).
3. `scripts/prerender.mjs`: يكتب في `dist/`:
   - HTML مولَّدًا مسبقًا للصفحة الرئيسية و`/privacy/` و`/terms/`.
   - وسوم المشاركة (Open Graph) وبيانات Organization وFAQPage المنظَّمة.
   - `robots.txt` و`sitemap.xml`.
   - `_headers`: تخزين دائم لـ `/assets/*` وترويسات الأمان (CSP مع بصمة السكربت المضمَّن).

`SITE_URL` يحدّد الروابط المطلقة في المعاينة وخريطة الموقع. القيمة الافتراضية هي عنوان `workers.dev` الحالي؛ غيّرها عند الانتقال إلى نطاق خاص.

ارفع محتوى `dist/` كما هو، ومعه `_headers` (يقرؤه Cloudflare Workers Static Assets وPages تلقائيًّا). يجب أن يبقى إعداد التوجيه «تطبيق صفحة واحدة» (`not_found_handling: single-page-application`) حتى تعمل مسارات `#/...`.

## تفعيل الإرسال الحقيقي لنموذج التواصل

دون هذه الخطوة يعمل النموذج في «نسخة عرض»: يقول للزائر صراحة إن طلبه لم يُرسَل، ويحفظه في متصفحه فقط.

1. أنشئ مساحة KV:

   ```bash
   npx wrangler kv namespace create LEADS
   ```

2. انسخ `docs/deploy/leads-worker.js` إلى `worker/index.js`، وأنشئ `wrangler.jsonc` في جذر المشروع:

   ```jsonc
   {
     "name": "mushriq",
     "main": "worker/index.js",
     "compatibility_date": "2026-10-01",
     "assets": { "directory": "./dist", "binding": "ASSETS", "not_found_handling": "single-page-application", "run_worker_first": ["/api/*"] },
     "kv_namespaces": [{ "binding": "LEADS", "id": "<المعرّف من الخطوة 1>" }]
   }
   ```

3. ابنِ مع عنوان الخادم ثم انشر:

   ```bash
   VITE_LEADS_ENDPOINT=/api/leads SITE_URL=https://<النطاق> npm run build
   npx wrangler deploy
   ```

4. لقراءة الطلبات الواردة:

   ```bash
   npx wrangler kv key list --binding LEADS --prefix lead:
   npx wrangler kv key get --binding LEADS "<المفتاح>"
   ```

الخادم يرفض الطلبات من أصل آخر، ويتحقّق من الاسم ووسيلة التواصل (بريد أو جوال سعودي، بالأرقام العربية أو اللاتينية)، ويحدّ كل عنوان IP بخمسة طلبات في الساعة.

إن كان الخادم على نطاق آخر (مثل `https://api.example.com/leads`)، فالسكربت يضيف أصله تلقائيًّا إلى `connect-src` في CSP.

## ما يُستكمل قبل الإطلاق

- قنوات التواصل الحقيقية في `CONTACT` (`src/marketing/content.js`): تظهر في قسم التواصل وزر واتساب حين تُعبّأ.
- بيانات `LEGAL` (`src/marketing/legal.js`): الكيان القانوني، والمقرّ، ومكان استضافة البيانات، وبريد طلبات الخصوصية. ما دامت فارغة تظهر صفحتا الخصوصية والشروط بعلامة «مسودة أوّلية».
- نطاق خاص وبريد عليه، ثم `SITE_URL` الجديد عند البناء.
