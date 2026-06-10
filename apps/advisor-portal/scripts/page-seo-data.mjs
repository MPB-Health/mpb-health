/**
 * Build-time SEO metadata for advisor.mpb.health routes.
 * All routes are noindex — this portal is authenticated staff tooling.
 */

const SITE = 'https://advisor.mpb.health';

function entry(path, { title, h1, description }) {
  return [
    path,
    {
      title,
      h1,
      description,
      canonicalUrl: `${SITE}${path === '/' ? '/' : path}`,
      robots: 'noindex, follow',
    },
  ];
}

export const ADVISOR_PAGE_SEO = Object.fromEntries([
  entry('/', {
    title: 'Advisor Portal | MPB Health',
    h1: 'Advisor Portal',
    description:
      'Secure sign-in for MPB Health advisors. Access training, bulletins, leads, and support tools in the Champion Advisor OS.',
  }),
  entry('/login', {
    title: 'Advisor Login | MPB Health',
    h1: 'Advisor Login',
    description:
      'Sign in to the MPB Health Advisor Portal to manage leads, training, bulletins, and client support. Authorized advisors only.',
  }),
  entry('/forgot-password', {
    title: 'Forgot Password | MPB Health Advisor Portal',
    h1: 'Forgot Password',
    description:
      'Reset your MPB Health advisor account password. Enter your email to receive a secure password reset link.',
  }),
  entry('/reset-password', {
    title: 'Reset Password | MPB Health Advisor Portal',
    h1: 'Reset Password',
    description:
      'Create a new password for your MPB Health advisor account using your secure reset link.',
  }),
  entry('/change-password', {
    title: 'Change Password | MPB Health Advisor Portal',
    h1: 'Change Password',
    description:
      'Update your MPB Health advisor account password to keep your Champion Advisor OS workspace secure.',
  }),
  entry('/landing', {
    title: 'Advisor Platform | ARYX',
    h1: 'Advisor Platform',
    description:
      'ARYX Advisor OS — the all-in-one platform for health advisors to manage leads, training, and client relationships.',
  }),
]);
