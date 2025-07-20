import Button from '../../components/button';
import { useRouter } from 'next/router';
import Menu from './menu';
import { useProSidebar } from 'react-pro-sidebar';
import { useTranslation } from 'react-i18next';
import { Popover, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import LogoutButton from '../../components/logout-button';
import useHeaderLayoutConfig from '../../hooks/useHeaderLayoutConfig';
import { useEffect } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { toggleSidebar } = useProSidebar();
  const { t } = useTranslation();
  const { setConfig } = useHeaderLayoutConfig();

  const handleScheduleAppointment = () => {
    router.push('/schedule/flow/select-patient');
  };

  useEffect(() => {
    setConfig({
      hideLogout: {
        mobile: true,
        desktop: false,
      },
      leftButtons: (
        <Button
          aria-label="menu"
          variant="tertiary"
          onClick={() => toggleSidebar()}
          className="h-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="white"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="white"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </Button>
      ),
      rightButtons: {
        mobile: (
          <Popover className="relative my-auto">
            <Popover.Button className="flex items-center justify-center gap-x-1 text-sm font-semibold leading-6 text-white pr-4">
              <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
            </Popover.Button>

            <Transition
              as={'div'}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute left-1/4 z-10 mt-6 flex w-screen max-w-max -translate-x-3/4">
                <div className="w-32 flex-auto overflow-hidden rounded-md bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
                  <div className="p-4 flex items-center flex-col gap-y-8">
                    <Button
                      className="border-none text-black"
                      variant="tertiary"
                      onClick={handleScheduleAppointment}
                    >
                      {t('ScheduleNow', 'Schedule Now')}
                    </Button>
                    <LogoutButton className="text-black" />
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50"></div>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>
        ),
        desktop: (
          <Button
            className="text-white hover:text-fs-green-600 focus:text-fs-green-600"
            variant="tertiary"
            onClick={handleScheduleAppointment}
          >
            {t('ScheduleNow', 'Schedule Now')}
          </Button>
        ),
      },
    });
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', zIndex: 9999 }}>
      <Menu />
      <main className="flex bg-white relative min-h-screen w-full">
        <div className="w-full pt-6 pb-16 px-8 md:px-12 max-w-5xl lg:max-w-full lg:px-20 mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
