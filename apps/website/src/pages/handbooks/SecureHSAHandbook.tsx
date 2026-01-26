import React from 'react';
import HandbookViewer from '../../components/HandbookViewer';
import { SEOHead } from '../../components/SEOHead';

const SecureHSAHandbook: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Secure HSA Handbook | MPB Health"
        description="View and download the MPB Health Secure HSA plan member handbook"
      />
      <HandbookViewer
        title="Secure HSA Handbook"
        pdfPath="/docs/Secure HSA Handbook-New Members.pdf"
        description="Complete guide for Secure HSA plan members"
      />
    </>
  );
};

export default SecureHSAHandbook;
