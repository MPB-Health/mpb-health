import React from 'react';
import HandbookViewer from '../../components/HandbookViewer';
import { SEOHead } from '../../components/SEOHead';

const ZionMemberGuidelines: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Zion Member Guidelines | MPB Health"
        description="View and download the Zion HealthShare member guidelines"
      />
      <HandbookViewer
        title="Zion Member Guidelines"
        pdfPath="/docs/Zion Member Guidelines.pdf"
        description="Comprehensive member guidelines for Zion HealthShare participants"
      />
    </>
  );
};

export default ZionMemberGuidelines;
