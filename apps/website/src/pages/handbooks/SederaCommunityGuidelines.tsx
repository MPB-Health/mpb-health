import React from 'react';
import HandbookViewer from '../../components/HandbookViewer';
import { SEOHead } from '../../components/SEOHead';

const SederaCommunityGuidelines: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Sedera Community Guidelines | MPB Health"
        description="View and download the Sedera Community Guidelines"
      />
      <HandbookViewer
        title="Sedera Community Guidelines"
        pdfPath="/docs/Sedera-Community-Guidelines-2 (1).pdf"
        description="Community guidelines for Sedera HealthShare members"
      />
    </>
  );
};

export default SederaCommunityGuidelines;






