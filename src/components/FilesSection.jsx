import React from "react";
import {
  Download,
  FileText,
  FolderOpen,
  MoreHorizontal,
  Search,
  Upload,
} from "lucide-react";

const files = [
  {
    name: "ملخص الدوال الخطية.pdf",
    type: "ملخص درس",
    size: "2.4 MB",
    date: "اليوم، 09:30 ص",
    color: "coral",
  },
  {
    name: "واجب القراءة النقدية.docx",
    type: "واجب",
    size: "840 KB",
    date: "أمس، 04:20 م",
    color: "blue",
  },
  {
    name: "خطة المراجعة الأسبوعية.pdf",
    type: "خطة علاجية",
    size: "1.1 MB",
    date: "الأحد، 11:00 ص",
    color: "teal",
  },
  {
    name: "تسجيل شرح قوانين نيوتن.mp4",
    type: "مادة إثرائية",
    size: "18.6 MB",
    date: "الخميس، 07:15 م",
    color: "orange",
  },
];

export default function FilesSection({ notify }) {
  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <FolderOpen size={15} /> مكتبتك التعليمية
          </span>
          <h1>الملفات والموارد</h1>
          <p>كل الملخصات والواجبات والمواد الإثرائية في مكان واحد.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => notify("تم فتح نافذة رفع ملف")}
        >
          <Upload size={17} /> رفع ملف
        </button>
      </section>
      <div className="files-toolbar">
        <div className="file-search">
          <Search size={16} />
          <input placeholder="ابحث في ملفاتك..." />
        </div>
        <div className="file-filters">
          <button className="filter-active">كل الملفات</button>
          <button>ملخصات</button>
          <button>واجبات</button>
          <button>مواد إثرائية</button>
        </div>
      </div>
      <section className="panel files-panel">
        <div className="files-head">
          <span>الاسم</span>
          <span>النوع</span>
          <span>الحجم</span>
          <span>آخر تعديل</span>
          <span />
        </div>
        {files.map((file) => (
          <div className="file-row" key={file.name}>
            <div className="file-name">
              <div className={`file-icon ${file.color}`}>
                <FileText size={17} />
              </div>
              <div>
                <strong>{file.name}</strong>
                <span>تمت المزامنة مع مسارك التعليمي</span>
              </div>
            </div>
            <span className="file-type">{file.type}</span>
            <span className="file-meta">{file.size}</span>
            <span className="file-meta">{file.date}</span>
            <div className="file-actions">
              <button
                aria-label={`تنزيل ${file.name}`}
                onClick={() => notify(`جاري تنزيل ${file.name}`)}
              >
                <Download size={16} />
              </button>
              <button
                aria-label={`خيارات ${file.name}`}
                onClick={() => notify("تم فتح خيارات الملف")}
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
