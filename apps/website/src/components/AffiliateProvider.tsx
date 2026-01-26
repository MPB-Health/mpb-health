import React, { createContext, useContext, ReactNode } from 'react';

interface AffiliateContextType {
  appendAffParam: (url: string) => string;
}

const AffiliateContext = createContext<AffiliateContextType>({
  appendAffParam: (url: string) => url,
});

export function useAffiliate() {
  return useContext(AffiliateContext);
}

interface AffiliateProviderProps {
  children: ReactNode;
}

export function AffiliateProvider({ children }: AffiliateProviderProps) {
  const appendAffParam = (url: string) => {
    return url;
  };

  return (
    <AffiliateContext.Provider value={{ appendAffParam }}>
      {children}
    </AffiliateContext.Provider>
  );
}
