// صفحات سياسة الخصوصية وشروط الاستخدام (عربي + إنجليزي).
// المحتوى مبنيّ على التزامات المنتج الفعلية فقط. بيانات الكيان القانوني ومكان الاستضافة وقناة التواصل
// تُعبّأ في LEGAL؛ ما يبقى فارغًا يظهر للزائر كبند «قيد الاستكمال» بدل أن نخترعه.

export const LEGAL = {
  entity: "", // الاسم القانوني للكيان المشغّل ورقم السجل
  city: "", // مقرّ الكيان
  hosting: "", // مكان استضافة البيانات (الدولة / مزوّد الخدمة)
  email: "", // بريد طلبات الخصوصية
  updated: { ar: "١٥ أكتوبر ٢٠٢٦", en: "15 October 2026" },
};

const PENDING = {
  ar: "قيد الاستكمال قبل الإطلاق الرسمي",
  en: "To be completed before the official launch",
};

const fill = (v, lang) => v || PENDING[lang];

export function legalDoc(kind, lang) {
  const en = lang === "en";
  const L = (ar, eng) => (en ? eng : ar);
  const entity = fill(LEGAL.entity, lang);
  const hosting = fill(LEGAL.hosting, lang);
  const email = fill(LEGAL.email, lang);

  const draft = !LEGAL.entity || !LEGAL.hosting || !LEGAL.email;

  if (kind === "privacy")
    return {
      title: L("سياسة الخصوصية", "Privacy policy"),
      updated: L(`آخر تحديث: ${LEGAL.updated.ar}`, `Last updated: ${LEGAL.updated.en}`),
      draft: draft && L("مسودة أوّلية: تُستكمل بيانات الكيان القانوني ومكان استضافة البيانات وقناة طلبات الخصوصية قبل الإطلاق الرسمي.", "Initial draft: the legal entity, data hosting location and privacy contact will be completed before the official launch."),
      sections: [
        {
          h: L("من نحن", "Who we are"),
          p: [
            L("مشرق منصّة تعليمية عربية تشرح المنهج وتلخّصه وتختبر الطالب بعد كل درس، وتتيح للمدرسة ووليّ الأمر والمعلّم متابعة التعلّم.", "Mushriq is an Arabic learning platform that explains and summarises the curriculum, quizzes students after every lesson, and lets schools, parents and teachers follow learning."),
            L(`الجهة المسؤولة عن البيانات: ${entity}.`, `Data controller: ${entity}.`),
          ],
        },
        {
          h: L("النسخة الحالية نسخة عرض", "The current version is a demo"),
          p: [
            L("الموقع الحالي نسخة عرض ببيانات وهمية. ما تُدخله فيه يُحفظ في متصفحك على جهازك فقط، ولا يُرسَل إلى خوادمنا، ويمكنك مسحه من الإعدادات أو بمسح بيانات الموقع في المتصفح.", "This site is a demo with fake data. Anything you enter is stored only in your browser on your device and is not sent to our servers. You can clear it from Settings or by clearing the site data in your browser."),
          ],
        },
        {
          h: L("البيانات التي نجمعها", "Data we collect"),
          list: [
            L("بيانات الحساب: الاسم، والبريد الإلكتروني أو رقم الجوال، والدور (طالب، وليّ أمر، معلّم، إدارة).", "Account data: name, email or mobile number, and role (student, parent, teacher, administration)."),
            L("بيانات التعلّم: الإجابات، ونتائج الاختبارات، والإتقان لكل هدف تعلّم، والحضور، والواجبات.", "Learning data: answers, quiz results, mastery per learning objective, attendance and assignments."),
            L("الموافقات التي يمنحها وليّ الأمر وتاريخها.", "Consents given by the parent, with their dates."),
            L("بيانات نموذج التواصل: الاسم، ووسيلة التواصل، والجهة، والرسالة.", "Contact form data: name, contact method, organisation and message."),
          ],
        },
        {
          h: L("كيف نستخدمها", "How we use it"),
          list: [
            L("تقديم الشرح والاختبارات وبناء الخطط العلاجية لكل طالب.", "To deliver explanations and quizzes and build each student's remedial plan."),
            L("عرض التقدّم لوليّ الأمر والمعلّم وإدارة المدرسة، كلٌّ بحسب دوره.", "To show progress to the parent, the teacher and the school administration, each according to their role."),
            L("الرد على طلبات التواصل.", "To answer contact requests."),
          ],
        },
        {
          h: L("بيانات الأطفال", "Children's data"),
          list: [
            L("حساب الطالب القاصر يُربط بوليّ أمره، ولا تُفعَّل معالجة بياناته دون موافقة صريحة من وليّ الأمر.", "A minor's student account is linked to their parent, and their data is not processed without the parent's explicit consent."),
            L("لا نستخدم بيانات الطلاب لتدريب نماذج الذكاء الاصطناعي.", "We do not use student data to train AI models."),
            L("لا نبيع البيانات، ولا نعرض إعلانات للطلاب.", "We do not sell data and we do not show ads to students."),
            L("كل محتوى أو اختبار أو درجة يقترحها الذكاء الاصطناعي يراجعها المعلّم ويعتمدها قبل أن تصل إلى الطالب.", "Every piece of content, quiz or grade suggested by AI is reviewed and approved by a teacher before it reaches the student."),
          ],
        },
        {
          h: L("من يطّلع على البيانات", "Who can see the data"),
          list: [
            L("كل مستخدم يرى ما يخصّ دوره فقط: الطالب بياناته، ووليّ الأمر أبناءه، والمعلّم فصوله، وإدارة المدرسة مدرستها.", "Each user sees only what their role allows: students their own data, parents their children, teachers their classes, administrators their school."),
            L("مزوّدو الخدمة التقنية الذين نتعاقد معهم للاستضافة، وبالقدر اللازم للتشغيل فقط.", "Technical service providers we contract for hosting, only as far as operation requires."),
            L(`مكان استضافة البيانات: ${hosting}.`, `Data hosting location: ${hosting}.`),
          ],
        },
        {
          h: L("الحماية", "Security"),
          list: [
            L("تسجيل دخول بخطوتين وحدّ لمحاولات الدخول.", "Two-step sign-in and a limit on sign-in attempts."),
            L("صلاحيات مقيّدة لكل دور.", "Permissions restricted by role."),
            L("سجلّ تدقيق يحفظ كل إجراء حسّاس باسم فاعله ووقته.", "An audit log that records every sensitive action with who did it and when."),
          ],
        },
        {
          h: L("حقوقك", "Your rights"),
          p: [
            L("يحقّ لك الاطّلاع على بياناتك وطلب تصحيحها أو حذفها، وسحب موافقتك في أيّ وقت من صفحة الموافقات والخصوصية في حساب وليّ الأمر، وذلك وفق نظام حماية البيانات الشخصية في المملكة العربية السعودية.", "You may access your data, ask for it to be corrected or deleted, and withdraw consent at any time from the consents and privacy page in the parent account, in line with the Saudi Personal Data Protection Law."),
            L(`لطلبات الخصوصية: ${email}.`, `Privacy requests: ${email}.`),
          ],
        },
      ],
    };

  return {
    title: L("شروط الاستخدام", "Terms of use"),
    updated: L(`آخر تحديث: ${LEGAL.updated.ar}`, `Last updated: ${LEGAL.updated.en}`),
    draft: draft && L("مسودة أوّلية: تُستكمل بيانات الكيان القانوني والجهة القضائية المختصّة قبل الإطلاق الرسمي.", "Initial draft: the legal entity and the competent jurisdiction will be completed before the official launch."),
    sections: [
      {
        h: L("الخدمة", "The service"),
        p: [
          L(`مشرق منصّة تعليمية تقدّمها ${entity}. باستخدامك المنصّة توافق على هذه الشروط.`, `Mushriq is a learning platform provided by ${entity}. By using it you agree to these terms.`),
          L("الموقع الحالي نسخة عرض ببيانات وهمية، ولا يقدّم خدمة تعليمية فعلية بعد.", "This site is currently a demo with fake data and does not yet provide an actual learning service."),
        ],
      },
      {
        h: L("الحسابات والأدوار", "Accounts and roles"),
        list: [
          L("لكل حساب دور واحد يحدّد ما يراه ويفعله.", "Each account has one role that determines what it can see and do."),
          L("حساب الطالب القاصر يُنشأ ويُدار بموافقة وليّ أمره.", "A minor's student account is created and managed with their parent's consent."),
          L("حساب المعلّم لا يُفعَّل إلا بعد مراجعة طلب الانضمام واعتماده.", "A teacher account is activated only after the join request is reviewed and approved."),
          L("أنت مسؤول عن سرّية بيانات دخولك.", "You are responsible for keeping your sign-in details confidential."),
        ],
      },
      {
        h: L("محتوى الذكاء الاصطناعي", "AI-generated content"),
        p: [
          L("الشرح والملخّصات والاختبارات والتقييمات المبدئية يولّدها الذكاء الاصطناعي ويراجعها المعلّم قبل أن تصل إلى الطالب. وهي وسيلة مساعدة لا تحلّ محلّ المعلّم أو المدرسة.", "Explanations, summaries, quizzes and suggested grades are generated by AI and reviewed by a teacher before they reach the student. They support, and do not replace, the teacher or the school."),
        ],
      },
      {
        h: L("الاستخدام المقبول", "Acceptable use"),
        list: [
          L("لا تستخدم المنصّة للإساءة إلى أيّ مستخدم أو نشر محتوى مخالف.", "Do not use the platform to harm any user or to publish unlawful content."),
          L("لا تحاول الوصول إلى بيانات لا يسمح بها دورك.", "Do not try to access data your role does not allow."),
        ],
      },
      {
        h: L("الأسعار", "Prices"),
        p: [L("الأسعار المعروضة في الصفحة الرئيسية إرشادية حتى الإطلاق، وتُعتمد الأسعار النهائية عند الاشتراك.", "Prices shown on the home page are indicative until launch; final prices are confirmed at subscription.")],
      },
      {
        h: L("التعديلات والتواصل", "Changes and contact"),
        p: [
          L("قد نحدّث هذه الشروط، ونعلن عن أيّ تغيير جوهري داخل المنصّة قبل سريانه.", "We may update these terms and will announce any material change inside the platform before it takes effect."),
          L(`للتواصل: ${email}.`, `Contact: ${email}.`),
        ],
      },
    ],
  };
}
