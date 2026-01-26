import React from 'react';
import HandbookViewer from '../../components/HandbookViewer';
import { SEOHead } from '../../components/SEOHead';

const DirectHandbook: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Direct Handbook | MPB Health"
        description="View and download the MPB Health Direct plan member handbook"
      />
      <HandbookViewer
        title="Direct Handbook"
        pdfPath="/docs/Direct Handbook-New Members (2).pdf"
        description="Complete guide for Direct plan members"
      />
    </>
  );
};

export default DirectHandbook;
