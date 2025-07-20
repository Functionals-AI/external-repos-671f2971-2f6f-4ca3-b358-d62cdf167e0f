'use client';

import { ReactNode, useState } from 'react';
import { MenuAlt3Icon } from '@heroicons/react/outline';
import DesktopMenu from './desktop';
import MobileMenu from './mobile';
import IconButton from '@/ui-components/button/icon';
import HeaderBar from './header';
import { IconProps } from '@/ui-components/icons/Icon';

export type AvatarProps = {
  src: string;
  fallback: string;
  href: string | null;
  isHighlighted?: boolean;
  text: string;
};

export type MenuItem = {
  name: string;
  href: string;
  iconName: IconProps['name'];
};

interface DashboardLayoutProps {
  children: ReactNode;
  mainBar?: ReactNode;
  rightHeader?: ReactNode;
  currentPath: string | null;
  menuItems: MenuItem[];
  avatar: AvatarProps;
}

export default function DashboardLayout({
  menuItems,
  mainBar,
  rightHeader,
  currentPath,
  avatar,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div>
        <MobileMenu
          menuItems={menuItems}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
          currentPath={currentPath}
        />

        <DesktopMenu menuItems={menuItems} currentPath={currentPath} avatar={avatar} />

        <div className="md:pl-20">
          <HeaderBar>
            <IconButton
              iconName={'hamburger'}
              variant="tertiary"
              className="p-1 text-gray-700 md:hidden"
              onClick={() => setSidebarOpen(true)}
            />
            {/* <span className="sr-only">Open sidebar</span> */}
            {/* <MenuAlt3Icon className="h-6 w-6" aria-hidden="true" /> */}

            {/* Separator */}
            <div className="h-6 w-px bg-gray-900/10 md:hidden" aria-hidden="true" />

            <div className="flex flex-1 gap-x-4 self-stretch md:gap-x-6">
              <div className="relative flex flex-1">{mainBar}</div>
              <div className="flex items-center gap-x-2">{rightHeader}</div>
            </div>
          </HeaderBar>

          <main
            style={{
              height: 'calc(100vh - 5rem)',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
