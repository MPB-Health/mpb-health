import React from 'react';

export function ComplianceNoteMVP() {
  return (
    <section aria-labelledby="compliance-title" className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-700 ring-1 ring-gray-200">
          <h2 id="compliance-title" className="sr-only">
            Compliance and disclosures
          </h2>
          MPB Health provides access to qualified Health Sharing Programs. Health sharing is not
          insurance and does not guarantee payment of medical expenses. Program eligibility,
          waiting periods, and sharing limits apply. Always review the official guidelines and
          price sheets before enrolling.
          <div className="mt-2">
            <a
              className="underline"
              href="https://mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Official price sheets
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
