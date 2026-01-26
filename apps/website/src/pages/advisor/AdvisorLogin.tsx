import { UnifiedLoginPage } from '../../components/auth/UnifiedLoginPage';

export default function AdvisorLogin() {
  return (
    <UnifiedLoginPage
      portalType="advisor"
      title="Advisor Portal"
      subtitle="Welcome to MPB Health Advisor Center"
      onboardingPath="/advisor/onboarding"
      redirectPath="/advisor/dashboard"
      allowedRoles={['advisor', 'admin', 'superadmin']}
      showOnboarding={true}
    />
  );
}
