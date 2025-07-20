'use client';

import { ReactNode } from 'react';
import Layout, { MenuItem } from '@/layouts/dashboard';
import Toggle from '@/ui-components/toggle';
import { BannerManager } from '@/modules/banner';
import { usePathname, useRouter } from 'next/navigation';
import { useProviderContext } from '../provider-context';
import FoodsmartLogo from '@/icons/logo-large';
import { useFeatureFlags } from '@/modules/feature-flag';
import { Button } from '@/ui-components/button';
import usePiiManager from '@/modules/pii-manager/usePiiManager';
import { Trans, useTranslation } from 'react-i18next';
import Icon from '@/ui-components/icons/Icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui-components/dropdown-menu';
import localStorageHelpers from 'utils/localStorageHelpers';
import { ReportIssueNavItem } from '@/smart-components/report-issue-button';
import useIntercom from 'hooks/useIntercom';

export default function ProviderLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const {
    providerData: { provider, intercomHash },
    logout,
  } = useProviderContext();
  const featureFlags = useFeatureFlags();
  const pii = usePiiManager();
  useIntercom({ provider, intercomHash });

  const currLocale = i18n.language;

  const LOCALE_STRS: Record<string, string> = {
    en: t('English'),
    es: t('Spanish'),
  };

  const menuItems: MenuItem[] = [
    { name: t('Home'), href: '/schedule/provider/dashboard', iconName: 'calendar' },
    { name: t('Members'), href: '/schedule/provider/patients', iconName: 'patient' },
    ...(featureFlags.hasFeature('provider_performance_metrics_ENG_1736')
      ? ([
          {
            name: 'Performance metrics',
            href: '/schedule/provider/metrics',
            iconName: 'reporting-dashboard',
          },
        ] satisfies MenuItem[])
      : []),
    ...(featureFlags.hasFeature('developer')
      ? ([
          {
            name: 'Showcase',
            href: '/schedule/provider/showcase',
            iconName: 'code',
          },
        ] satisfies MenuItem[])
      : []),
    ...(featureFlags.hasFeature('developer')
      ? ([
          {
            name: 'Feature Flags',
            href: '/schedule/provider/feature-flags',
            iconName: 'flag',
          },
        ] satisfies MenuItem[])
      : []),
  ];

  function changeLanguage(lng: 'es' | 'en') {
    localStorageHelpers.set('locale', lng);
    window.location.reload();
  }

  return (
    <Layout
      avatar={{
        text: t('My profile'),
        isHighlighted: false,
        href: '/schedule/provider/profile',
        src: provider.photo,
        fallback: provider.initials,
      }}
      mainBar={
        <div className="h-full flex items-center">
          <Button variant="tertiary">
            <FoodsmartLogo
              className="h-6 fill-fs-green-600"
              onClick={() => router.push('/schedule/provider/dashboard')}
            />
          </Button>
        </div>
      }
      rightHeader={
        <>
          {featureFlags.hasFeature('provider_dashboard_0_9_improvements_DEV_16908') && (
            <div className="flex items-center gap-x-1">
              <Toggle enabled={pii.isPiiHidden} setEnabled={pii.setIsPiiHidden} />
              <p>Hide PII</p>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                leftIcon={{ name: 'globe', color: 'neutral-200' }}
                className="text-type-secondary"
                variant="tertiary"
              >
                <Trans>{LOCALE_STRS[currLocale]}</Trans>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuItem
                type={currLocale === 'en' ? 'selected' : 'default'}
                onClick={() => changeLanguage('en')}
              >
                <Trans>English</Trans>
              </DropdownMenuItem>
              <DropdownMenuItem
                type={currLocale === 'es' ? 'selected' : 'default'}
                onClick={() => changeLanguage('es')}
              >
                <Trans>Spanish</Trans>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {featureFlags.hasFeature('intercom_ENG_2121') ? (
            <Button
              variant="tertiary"
              className="w-fit px-2 intercom-trigger"
              title={t('Report an issue')}
              aria-label={t('Report an issue')}
              // this button activates intercom
              // modify behavior on intercom admin console
            >
              <Icon name="feedback" color={'neutral-200'} />
            </Button>
          ) : (
            <ReportIssueNavItem />
          )}

          <Button aria-label="logout" className="w-fit px-2" variant="tertiary" onClick={logout}>
            <Icon name="log-out" color={'neutral-200'} />
          </Button>
        </>
      }
      menuItems={menuItems}
      currentPath={pathname}
    >
      <BannerManager>{children}</BannerManager>
    </Layout>
  );
}
