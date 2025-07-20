import Link from 'next/link';
import {
  Sidebar,
  Menu as SidebarMenu,
  MenuItem as SidebarMenuItem,
  sidebarClasses,
  useProSidebar,
  menuClasses,
} from 'react-pro-sidebar';
import { COLORS } from '../../utils/colors';
import HomeIcon from '../../../public/home.svg';
import AccountIcon from '../../../public/account.svg';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import FoodsmartLogo from '../../../public/logo.svg';

export default function Menu() {
  const { toggled } = useProSidebar();
  const router = useRouter();
  const [hideSidebar, setHideSidebar] = useState(true);
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 960px)');

  useEffect(() => {
    setTimeout(() => {
      setHideSidebar(false);
    }, 1000);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '400px' }}>
      <Sidebar
        breakPoint="always"
        rootStyles={{
          display: hideSidebar ? 'none' : 'block',
          position: 'fixed',
          height: '100vh',
          backgroundColor: COLORS['f-dark-green'],
          zIndex: 9999,
          left: 0,
          top: 0,
          width: !toggled ? '12rem' : isMobile ? '18rem' : '26rem',
          [`.${sidebarClasses.container}`]: {
            backgroundColor: COLORS['f-very-dark-green'],
          },
          [`.${menuClasses.menuItemRoot} > a:hover`]: {
            backgroundColor: COLORS['f-light-grey'],
            color: COLORS['f-dark-green'],
          },
        }}
        style={{ backgroundColor: COLORS['f-dark-green'] }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="px-12 flex items-center py-8">
            <div className="flex-shrink-0">
              <FoodsmartLogo />
            </div>
          </div>
          <SidebarMenu
            className="pl-4"
            menuItemStyles={{
              button: (button) => {
                return button.active
                  ? {
                      backgroundColor: COLORS['f-light-grey'],
                      color: COLORS['f-dark-green'],
                      marginBottom: '1rem',
                    }
                  : { color: COLORS['f-light-grey'], marginBottom: '1rem' };
              },
            }}
          >
            <SidebarMenuItem
              active={router.pathname === '/schedule/dashboard'}
              prefix={<HomeIcon />}
              component={<Link href="/schedule/dashboard" className="flex gap-x-6 px-8 py-6" />}
            >
              {t('Home', `Home`)}
            </SidebarMenuItem>
            <SidebarMenuItem
              active={router.pathname === '/schedule/dashboard/account'}
              prefix={<AccountIcon />}
              component={
                <Link href="/schedule/dashboard/account" className="flex gap-x-6 px-8 py-6" />
              }
            >
              {t('Account', `Account`)}
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </Sidebar>
    </div>
  );
}
