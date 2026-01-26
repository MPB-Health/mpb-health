import React from 'react';
import HandbookViewer from '../../components/HandbookViewer';
import { SEOHead } from '../../components/SEOHead';

const MECEssentialsHandbook: React.FC = () => {
  return (
    <>
      <SEOHead
        title="MEC+ Essentials Handbook | MPB Health"
        description="View and download the MPB Health MEC+ Essentials plan member handbook"
      />
      <HandbookViewer
        title="MEC+ Essentials Handbook"
        pdfPath="/docs/MEC+Essentials Handbook-New Members 1.pdf"
        description="Complete guide for MEC+ Essentials plan members"
      />
    </>
  );
};

export default MECEssentialsHandbook;
