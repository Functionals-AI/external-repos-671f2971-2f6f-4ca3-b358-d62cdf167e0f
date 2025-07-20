import { Combobox, Transition } from '@headlessui/react';
import type { ProviderRecordShort } from '@mono/telenutrition/lib/types';
import { Button } from '@/ui-components/button';
import { CheckIcon, ChevronDown } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inputClasses } from 'components/form/helpers';

interface ProviderSearchProps {
  selectedProvider: ProviderRecordShort | null;
  setSelectedProvider: (provider: ProviderRecordShort | null) => void;
  providers: ProviderRecordShort[];
}

export default function ProviderSearch({
  selectedProvider,
  setSelectedProvider,
  providers,
}: ProviderSearchProps) {
  const { t } = useTranslation();

  const [query, setQuery] = useState('');

  const sortedProviders = providers.sort((p1, p2) => (p1.name[0] > p2.name[0] ? 1 : -1));

  const filteredProviders =
    query === ''
      ? sortedProviders
      : sortedProviders.filter((person) =>
          person.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, '')),
        );

  return (
    <>
      <Combobox value={selectedProvider} onChange={setSelectedProvider}>
        <div className="relative m-2">
          <div className="relative w-full cursor-default overflow-hidden focusable">
            <Combobox.Input
              placeholder="Type here to search for a provider..."
              className={inputClasses}
              displayValue={(provider) => (provider ? (provider as ProviderRecordShort).name : '')}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Combobox.Button
              aria-label="dropdown all providers"
              className="absolute inset-y-0 right-0 flex items-center pr-2"
            >
              <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg focus:outline-none sm:text-sm z-50">
              {filteredProviders.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                  {t('', 'No Providers found')}
                </div>
              ) : (
                filteredProviders.map((provider) => (
                  <Combobox.Option
                    key={provider.providerId}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-f-dark-green text-white' : 'text-gray-900'
                      }`
                    }
                    value={provider}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                        >
                          {provider.name}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-fs-green-300'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      {selectedProvider !== null ? (
        <Button
          onClick={() => setSelectedProvider(null)}
          type="button"
          variant="tertiary"
          className="rounded-md"
        >
          {t('Clear', 'Clear')}
        </Button>
      ) : null}
    </>
  );
}
