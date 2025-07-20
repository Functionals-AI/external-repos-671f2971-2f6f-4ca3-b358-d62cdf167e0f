'use client';

import { ReactNode } from 'react';

import { cn } from '@/utils';
import { Button } from '@/ui-components/button';
import FoodsmartLogo from '@/icons/logo-large';
import { useRouter } from 'next/navigation';

function NonDashboardLayout({ children }: { children: ReactNode }) {
  return <div className="relative h-full flex flex-col overflow-hidden">{children}</div>;
}

interface HeaderProps {
  subTitle?: ReactNode | string;
  rightHeader?: ReactNode;
  className?: string;
  logoAsButton?: boolean;
}

function Header({ subTitle, rightHeader, className, logoAsButton = true }: HeaderProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        'flex !h-14 items-center gap-x-4 border-b border-neutral-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 md:px-8 sticky top-0',
        className,
      )}
    >
      <div className="flex gap-x-4 flex-1">
        {logoAsButton ? (
          <Button variant="tertiary" onClick={() => router.push('/schedule/provider/dashboard')}>
            <FoodsmartLogo className="h-6 fill-fs-green-600" />
          </Button>
        ) : (
          <div className='py-4'>
            <FoodsmartLogo className="h-6 fill-fs-green-600" />
          </div>
        )}
        {!subTitle ? null : typeof subTitle === 'string' ? (
          <h3 className="text-[20px]">{subTitle}</h3>
        ) : (
          <>{subTitle}</>
        )}
      </div>
      {!!rightHeader && rightHeader}
    </div>
  );
}

interface ContentProps {
  children: ReactNode;
  dataTestId?: string;
  scrollable?: boolean;
  className?: string;
}

function Content({ children, className, dataTestId, scrollable }: ContentProps) {
  return (
    <main
      data-testid={dataTestId}
      className={cn('h-full flex flex-col mb-16', scrollable && 'overflow-y-scroll', className)}
    >
      <div className="flex-1 my-8 mx-6 md:mx-10 lg:mx-14 xl:mx-16">{children}</div>
    </main>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-16 border-t border-t-neutral-150 absolute bottom-0 bg-white">
      {children}
    </div>
  );
}

NonDashboardLayout.Header = Header;
NonDashboardLayout.Content = Content;
NonDashboardLayout.Footer = Footer;

export default NonDashboardLayout;
