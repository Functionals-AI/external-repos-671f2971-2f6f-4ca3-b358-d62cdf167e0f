import Link from 'next/link';
import classNames from '../../../utils/classNames';
import { useTranslation } from 'react-i18next';

export type TabId = 'privacy-policy' | 'disclaimer' | 'app-terms';

interface Tab {
  name: string;
  href: string;
  id: TabId;
}

export default function Tabs({ current }: { current: TabId }) {
  const { t } = useTranslation();

  const tabs: Tab[] = [
    {
      id: 'privacy-policy',
      name: t('PrivacyPolicy', 'Privacy Policy'),
      href: '/schedule/legal/privacy',
    },
    { id: 'disclaimer', name: t('Disclaimer', 'Disclaimer'), href: '/schedule/legal/disclaimer' },
    { id: 'app-terms', name: t('Terms', 'Terms'), href: '/schedule/legal/app-terms' },
  ];

  const isTabCurrent = (tab: Tab) => tab.id === current;

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-f-light-green focus:outline-none focus:ring-f-light-green sm:text-sm"
          defaultValue={tabs.find((tab) => tab.id === current)?.id}
        >
          {tabs.map((tab) => (
            <option key={tab.id}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={classNames(
                  isTabCurrent(tab)
                    ? 'border-f-light-green text-f-dark-green'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium',
                )}
                aria-current={isTabCurrent(tab) ? 'page' : undefined}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
