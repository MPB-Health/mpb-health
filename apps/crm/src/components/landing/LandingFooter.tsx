import { Link } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const footerLinks: Record<string, FooterLink[]> = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pipeline', href: '#pipeline' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Integrations', href: '#features' },
  ],
  Company: [
    { label: 'About MPB Health', href: 'https://mpb.health/about', external: true },
    { label: 'Careers', href: 'https://mpb.health/careers', external: true },
    { label: 'Contact', href: 'mailto:sales@mpb.health', external: true },
    { label: 'Blog', href: 'https://mpb.health/blog', external: true },
  ],
  Legal: [
    { label: 'Privacy Policy', href: 'https://mpb.health/privacy', external: true },
    { label: 'Terms of Service', href: 'https://mpb.health/terms', external: true },
    { label: 'HIPAA Compliance', href: 'https://mpb.health/hipaa', external: true },
    { label: 'Security', href: 'https://mpb.health/security', external: true },
  ],
  Platform: [
    { label: 'CRM', href: '/' },
    { label: 'Admin Portal', href: 'https://admin.mpb.health', external: true },
    { label: 'Advisor Portal', href: 'https://advisor.mpb.health', external: true },
    { label: 'Concierge Portal', href: 'https://concierge.mpb.health', external: true },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-4">
                {section}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : link.href.startsWith('#') ? (
                      <a href={link.href} className="text-sm hover:text-white transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-sm hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/MPB-Health-No-background.png"
              alt="MPB Health"
              className="h-8 w-auto opacity-60"
            />
            <span className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} MPB Health. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <Lock className="h-3.5 w-3.5" />
              256-bit Encrypted
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <Shield className="h-3.5 w-3.5" />
              HIPAA Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
