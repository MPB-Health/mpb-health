import React from 'react';
import HandbookViewer from '../../components/HandbookViewer';
import { SEOHead } from '../../components/SEOHead';

const EssentialsHandbook: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Essentials Handbook | MPB Health"
        description="View and download the MPB Health Essentials plan member handbook"
      />
      <HandbookViewer
        title="Essentials Handbook"
        pdfPath="/docs/Essentials Handbook-New Members 1.pdf"
        description="Complete guide for Essentials plan members"
      />
    </>
  );
};

export default EssentialsHandbook;
