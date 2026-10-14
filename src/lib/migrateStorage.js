// نقل مفاتيح التخزين المحلي من «طاقات» (taqat-*) إلى «مشرق» (mushriq-*) مرّة واحدة،
// عند أوّل تشغيل حتى لا يفقد المستخدم لغته وتفضيلاته وبيانات العرض التجريبي.
const LEGACY_PREFIX = "taqat-";
const PREFIX = "mushriq-";

function migrate(store) {
  try {
    // لقطة من المفاتيح أوّلًا: ترتيب store.key(i) يتغيّر مع كل إضافة أو حذف
    const legacy = Object.keys(store).filter((k) => k.startsWith(LEGACY_PREFIX));
    for (const old of legacy) {
      const next = PREFIX + old.slice(LEGACY_PREFIX.length);
      if (store.getItem(next) === null) store.setItem(next, store.getItem(old));
      store.removeItem(old);
    }
  } catch {
    /* التخزين غير متاح (وضع خاص مثلًا): لا شيء يُنقل */
  }
}

// يعمل عند الاستيراد: main.jsx يستورد هذه الوحدة أوّلًا، قبل الوحدات التي تقرأ التخزين عند تحميلها (مثل i18n)
if (typeof window !== "undefined") {
  migrate(window.localStorage);
  migrate(window.sessionStorage);
}
