import React from 'react';
import HandbookViewer from '../../components/HandbookViewer';
import { SEOHead } from '../../components/SEOHead';

const MECEssentialsHandbook: React.FC = () => {
  return (
    <>
      <SEOHead
        title="HSA Essentials Handbook | MPB Health"
        description="View and download the MPB Health HSA Essentials membership handbook"
      />
      <HandbookViewer
        title="HSA Essentials Handbook"
        pdfPath="/docs/MEC+Essentials Handbook-New Members 1.pdf"
        description="Complete guide for HSA Essentials members"
      />
    </>
  );
};

export default MECEssentialsHandbook;
