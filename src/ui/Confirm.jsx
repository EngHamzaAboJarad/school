import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { Btn, Modal, cx } from "./Primitives";

// تأكيد الإجراءات الحسّاسة: const confirm = useConfirm(); if (await confirm({...})) doIt();
// tone: "danger" (حذف/إيقاف/رفض) | "warn" | "info". التركيز الافتراضي على «إلغاء» كي لا يُنفَّذ الإجراء بضغطة Enter عابرة.
const Ctx = createContext(async () => window.confirm("تأكيد؟"));
export const useConfirm = () => useContext(Ctx);

const ICON = { danger: Trash2, warn: AlertTriangle, info: Info };

export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null);
  const resolver = useRef(null);
  const confirm = useCallback((opts) => new Promise((resolve) => {
    resolver.current = resolve;
    setReq({ tone: "danger", confirmLabel: "تأكيد", cancelLabel: "إلغاء", ...opts });
  }), []);
  const close = (ok) => {
    resolver.current?.(ok);
    resolver.current = null;
    setReq(null);
  };
  const Icon = req ? req.icon || ICON[req.tone] || Info : null;
  return (
    <Ctx.Provider value={confirm}>
      {children}
      {req && (
        <Modal open size="sm" onClose={() => close(false)} title={req.title} footer={
          <>
            <Btn variant="ghost" onClick={() => close(false)} autoFocus>{req.cancelLabel}</Btn>
            <Btn variant={req.tone === "danger" ? "danger-solid" : "primary"} onClick={() => close(true)}>{req.confirmLabel}</Btn>
          </>
        }>
          <div className="confirm-body">
            <span className={cx("confirm-icon", `tone-${req.tone}`)} aria-hidden="true"><Icon size={20} /></span>
            <div className="stack-sm">
              {req.body && <p>{req.body}</p>}
              {req.detail}
            </div>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  );
}
