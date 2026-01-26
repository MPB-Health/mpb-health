import React from 'react';
import HandbookViewer from '../../components/HandbookViewer';
import { SEOHead } from '../../components/SEOHead';

const CarePlusHandbook: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Care+ Handbook | MPB Health"
        description="View and download the MPB Health Care+ plan member handbook"
      />
      <HandbookViewer
        title="Care+ Handbook"
        pdfPath="/docs/Care+ Handbook-New Members (3).pdf"
        description="Complete guide for Care+ plan members"
      />
    </>
  );
};

export default CarePlusHandbook;
