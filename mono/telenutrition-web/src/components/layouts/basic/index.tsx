import React from 'react';
import BasicLayoutFooter from './footer';
import BasicLayoutHeader, { BasicLayoutHeaderProps } from './header';
import { useAppStateContext } from '../../../state/context';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { isResponsiveConfig } from '../../../state/types/actions';

export type BasicLayoutProps = {
  children?: React.ReactNode;
};

export default function BasicLayout({ children }: BasicLayoutProps) {
  const {
    appState: { headerLayoutConfig },
  } = useAppStateContext();
  const isMobile = useMediaQuery('(max-width: 960px)');

  const headerProps: BasicLayoutHeaderProps = (() => {
    if (headerLayoutConfig === null) {
      return {};
    }

    const { leftButtons, hideLogout, rightButtons, hideLanguageSelector, mainButtons } =
      headerLayoutConfig;
    if (isMobile) {
      return {
        leftButtons: isResponsiveConfig(leftButtons) ? leftButtons.mobile : leftButtons,
        rightButtons: isResponsiveConfig(rightButtons) ? rightButtons.mobile : rightButtons,
        mainButtons: isResponsiveConfig(mainButtons) ? mainButtons.mobile : mainButtons,
        hideLogout: hideLogout?.mobile ?? false,
        hideLanguageSelector: hideLanguageSelector?.mobile ?? false,
      };
    }
    return {
      leftButtons: isResponsiveConfig(leftButtons) ? leftButtons.desktop : leftButtons,
      rightButtons: isResponsiveConfig(rightButtons) ? rightButtons.desktop : rightButtons,
      mainButtons: isResponsiveConfig(mainButtons) ? mainButtons.desktop : mainButtons,
      hideLogout: hideLogout?.desktop ?? false,
      hideLanguageSelector: hideLanguageSelector?.desktop ?? false,
    };
  })();

  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      <BasicLayoutHeader {...headerProps} />
      <main className="bg-white pb-8 min-h-full relative flex-1">{children}</main>
      <BasicLayoutFooter />
    </div>
  );
}
