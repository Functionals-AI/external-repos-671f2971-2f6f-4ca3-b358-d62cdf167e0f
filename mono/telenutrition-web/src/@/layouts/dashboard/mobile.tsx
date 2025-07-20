import LogoSmall from '../../../../public/logo-small.svg';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import classNames from 'utils/classNames';
import { MenuItem } from '.';
import Icon from '@/ui-components/icons/Icon';

interface MobileMenuProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  menuItems: MenuItem[];
  currentPath: string | null;
}

export default function MobileMenu({
  sidebarOpen,
  setSidebarOpen,
  menuItems,
  currentPath,
}: MobileMenuProps) {
  return (
    <Transition.Root show={sidebarOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0" style={{ background: 'rgb(100,100,100, 0.7)' }} />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>

              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-fs-green-600 px-6 pb-2 ring-1 ring-white/10">
                <div className="flex h-16 shrink-0 items-center">
                  <LogoSmall />
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="-mx-2 flex-1 space-y-1">
                    {menuItems.map((item) => (
                      <li key={item.name} className="flex items-center w-full">
                        <a
                          href={item.href}
                          className={classNames(
                            'w-full',
                            'transition-colors',
                            item.href === currentPath
                              ? 'bg-fs-green-300 text-white fill-white'
                              : '!text-green-100 fill-green-100 hover:!text-white hover:!fill-white hover:bg-fs-green-300',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                          )}
                        >
                          <Icon
                            name={item.iconName}
                            size="sm"
                            aria-hidden="true"
                            color={item.href === currentPath ? 'white' : 'fsGreen-100'}
                          />
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
