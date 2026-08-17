import React from 'react';
import HandbookViewer from '../../components/HandbookViewer';
import { SEOHead } from '../../components/SEOHead';

const CarePlusHandbook: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Care+ Handbook | MPB Health"
        description="View and download the MPB Health Care+ membership handbook"
      />
      <HandbookViewer
        title="Care+ Handbook"
        pdfPath="/docs/Care+ Handbook-New Members (3).pdf"
        description="Complete guide for Care+ members"
      />
    </>
  );
};

export default CarePlusHandbook;
