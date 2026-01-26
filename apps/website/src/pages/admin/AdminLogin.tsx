import { UnifiedLoginPage } from "../../components/auth/UnifiedLoginPage";

export default function AdminLogin() {
  return (
    <UnifiedLoginPage
      portalType="admin"
      title="Admin Portal"
      subtitle="Welcome to MPB Health Admin Center"
      redirectPath="/admin"
      allowedRoles={['admin', 'staff', 'superadmin']}
      showOnboarding={false}
    />
  );
}
