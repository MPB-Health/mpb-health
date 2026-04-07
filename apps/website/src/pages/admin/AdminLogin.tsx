import { UnifiedLoginPage } from "../../components/auth/UnifiedLoginPage";

export default function AdminLogin() {
  return (
    <UnifiedLoginPage
      portalType="admin"
      title="Website CMS"
      subtitle="Content & site management"
      redirectPath="/admin"
      allowedRoles={['admin', 'staff', 'superadmin']}
      showOnboarding={false}
    />
  );
}
