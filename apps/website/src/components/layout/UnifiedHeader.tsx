import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProspectHeader } from './ProspectHeader';
import { MemberHeader } from './MemberHeader';

export const UnifiedHeader: React.FC = () => {
  const { user } = useAuth();

  return user ? <MemberHeader /> : <ProspectHeader />;
};
