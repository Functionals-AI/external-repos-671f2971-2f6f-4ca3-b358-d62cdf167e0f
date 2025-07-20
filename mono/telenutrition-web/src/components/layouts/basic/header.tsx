import Link from 'next/link';
import LogoutButton from '../../logout-button';
import Button from '../../button';
import { Popover, Transition } from '@headlessui/react';
import { GlobeAltIcon } from '@heroicons/react/solid';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import FoodsmartLogo from '../../../../public/logo.svg';
import usePostEvent from '../../../api/usePostEvent';
import useAppUser from '../../../hooks/useAppUser';
import localStorageHelpers from '../../../utils/localStorageHelpers';
import { useAppStateContext } from '../../../state/context';
import { Auth } from '../../../state/types';
import { useMediaQuery } from 'hooks/useMediaQuery';
import LogoSmallIcon from '@/icons/logo-small';

function getLogoLink(auth: Auth | null) {
  if (!auth?.loggedIn) return '/schedule';

  if (auth.info.roles.some((role) => role === 'scheduler')) return '/schedule/dashboard';
  if (auth.info.roles.some((role) => role === 'provider')) return '/schedule/providers';
  if (auth.info.roles.some((role) => role === 'referrer')) return '/schedule/auth/referrer';
  return '/schedule/auth/login';
}

export interface BasicLayoutHeaderProps {
  leftButtons?: React.ReactNode;
  rightButtons?: React.ReactNode;
  mainButtons?: React.ReactNode;
  hideLogout?: boolean;
  hideLanguageSelector?: boolean;
}

export default function BasicLayoutHeader({
  rightButtons,
  hideLogout = false,
  hideLanguageSelector = false,
  leftButtons,
  mainButtons,
}: BasicLayoutHeaderProps) {
  const router = useRouter();
  const { post: postEvent } = usePostEvent({ pathname: router.pathname });
  const appUserResult = useAppUser({ required: false });
  const { i18n } = useTranslation();
  const {
    appState: { auth },
  } = useAppStateContext();
  const isDelegate =
    !appUserResult.loading && appUserResult.data ? appUserResult.data.isDelegate : false;
  const currLocale = i18n.language;
  const logoHref = getLogoLink(auth);
  const isLoggedIn = auth?.loggedIn;
  const isSmallest = useMediaQuery('(max-width: 650px)');

  const LOCALE_STRS: Record<string, string> = {
    en: 'English',
    es: 'Español',
  };

  const onLanguageChange = (locale: string) => {
    if (locale !== currLocale) {
      postEvent({
        type: 'click',
        name: 'language_selection',
        data: {
          new_locale: locale,
        },
      });

      // OVERWRITE _app.tsx onclose methods to ensure user isn't logged out.
      window.onclose = () => {};
      window.onunload = () => {};

      localStorageHelpers.set('locale', locale);
      router.reload();
    }
  };

  return (
    <header className="bg-f-dark-green sticky top-0 w-full z-10">
      <div className="mx-auto px-2 sm:px-4 lg:px-12">
        <div className="relative h-16 flex items-center justify-between lg:border-b-1 lg:border-indigo-400 lg:border-opacity-25">
          <div className="px-2 flex items-center lg:px-0 gap-x-6">
            {leftButtons && leftButtons}
            <div className="flex-shrink-0">
              <Link href={logoHref} aria-label="Go Home">
                {isSmallest ? (
                  <LogoSmallIcon className="h-8 w-6 fill-white ml-1" />
                ) : (
                  <FoodsmartLogo />
                )}
              </Link>
            </div>
            {isDelegate && <h4 className="m-4 text-f-yellow">DELEGATE</h4>}
            {mainButtons && mainButtons}
          </div>
          <div className="gap-x-4 flex">
            {!hideLanguageSelector && (
              <Popover className="relative my-auto">
                <Popover.Button className="flex items-center justify-center gap-x-1 text-sm font-semibold leading-6 text-white">
                  <span className="mr-2">{LOCALE_STRS[currLocale]}</span>
                  <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
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
                  <Popover.Panel className="absolute left-1/2 z-10 mt-6 flex w-screen max-w-max -translate-x-1/2 px-4">
                    <div className="w-32 flex-auto overflow-hidden rounded-md bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
                      <div className="p-4 flex items-center flex-col gap-y-8">
                        {Object.entries(LOCALE_STRS).map(([key, value]) => (
                          <Button
                            key={key}
                            className={key === currLocale ? 'text-f-dark-green' : ''}
                            onClick={() => onLanguageChange(key)}
                            variant="tertiary"
                          >
                            {value}
                          </Button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50"></div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </Popover>
            )}
            {!hideLogout && isLoggedIn && <LogoutButton />}
            {!!rightButtons && rightButtons}
          </div>
        </div>
      </div>
    </header>
  );
}
