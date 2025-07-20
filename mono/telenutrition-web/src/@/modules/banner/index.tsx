import React, { ReactNode, useContext, useState } from 'react';
import { DeveloperError } from 'utils/errors';
import Banner from './banner';

export type BannerVariant = 'primary' | 'warn' | 'destructive' | 'info';
export type BannerSize = 'large' | 'small';

export type Banner = {
  type: BannerVariant;
  size: BannerSize;
  message: string;
  description?: ReactNode;
  action?: {
    title: string;
    onClick: () => void;
  };
};

export type BannerState = {
  setBanner: (banner: Banner) => void;
};

const BannerContext = React.createContext<BannerState | null>(null);

function BannerManager({ children }: { children: ReactNode }) {
  const [bannerState, setBannerState] = useState<Banner | null>(null);
  return (
    <BannerContext.Provider value={{ setBanner: setBannerState }}>
      {bannerState && <Banner banner={bannerState} />}
      {children}
    </BannerContext.Provider>
  );
}

function useBanner() {
  const context = useContext(BannerContext);
  if (!context) throw new DeveloperError('Must have Banner Provider to use this hook');
  return context;
}

export { BannerManager, useBanner };
