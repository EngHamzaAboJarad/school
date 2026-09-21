import { KeyRound } from "lucide-react";
import { Card, Notice, Page } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { PermMatrix } from "../school/Users";

// التحكّم بالصلاحيات (F10.2): نظام أدوار وصلاحيات دقيق لكل الوظائف
export default function RbacPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  return (
    <Page kicker="الصلاحيات" title="الأدوار والصلاحيات (RBAC)" desc="تُقيَّد كل وظيفة بالصلاحية المناسبة لدور المستخدم. اضغط على أي خلية لمنح الصلاحية أو سحبها — ويُسجَّل كل تغيير." icon={KeyRound}>
      <Notice tone="warn" title="تغييرات حسّاسة">أي تعديل هنا يسري فورًا على جميع المستأجرين ويُوثَّق في سجلّ التدقيق باسمك.</Notice>
      <Card className="mt" flush><div className="pad"><PermMatrix rbac={state.rbac} onToggle={(role, perm) => { dispatch({ type: "togglePermission", role: role.id, roleLabel: role.long, perm, actor: user.id }); toast("عُدِّلت الصلاحية ووُثِّقت", "warn"); }} /></div></Card>
    </Page>
  );
}
