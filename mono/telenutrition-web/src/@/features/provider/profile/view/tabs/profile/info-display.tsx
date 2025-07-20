import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import { Badge } from '@/ui-components/badge';
import DataDisplay from '@/ui-components/data-display';
import type { ProviderRecord } from '@mono/telenutrition/lib/types';
import useProviderFormConsts from '../../../useProviderFormConsts';
import { getTimezoneName } from '../utils';

export default function ProviderInfoDisplay({ provider }: { provider: ProviderRecord }) {
  const { t } = useTranslation();
  const { specialtyIds, languages, minPatientAge } = useProviderFormConsts();

  return (
    <div data-testid="provider-info" className="max-w-[36rem] w-full">
      <DataDisplay
        label={t('Email')}
        content={provider.email ?? '-'}
        size={'xl'}
        className="mb-4"
        dataTestId="provider-email"
      />
      <DataDisplay
        label={t('Home phone')}
        content={provider.homePhone ?? '-'}
        size={'md'}
        className="mb-4"
        dataTestId="provider-home-phone"
      />
      <DataDisplay
        label={t('Timezone')}
        content={provider.timezone ? `${getTimezoneName(provider.timezone)} Timezone` : '-'}
        size={'md'}
        className="mb-4"
        dataTestId="provider-timezone"
      />
      <DataDisplay
        label={t('Languages')}
        size={'xl'}
        className="mb-4"
        content={
          <div className="mt-2 flex flex-wrap gap-1">
            {provider.languages?.length
              ? provider.languages
                  ?.map((lng) => _.get(languages, lng.toLocaleLowerCase(), lng))
                  .map((lng) => <Badge key={lng}>{lng}</Badge>)
              : '-'}
          </div>
        }
        dataTestId="provider-languages"
      />
      <DataDisplay
        label={t('Pediatrics')}
        content={_.get(minPatientAge, provider.minPatientAge, provider.minPatientAge) ?? '-'}
        size={'xl'}
        className="mb-4"
        dataTestId="provider-pediatrics"
      />
      <DataDisplay
        label={t('Specialties')}
        className="mb-4"
        content={
          <div className="mt-2 flex flex-wrap gap-1">
            {provider.specialtyIds?.length
              ? provider.specialtyIds
                  .map((sp) => _.get(specialtyIds, sp, sp))
                  .map((sp) => <Badge key={sp}>{sp}</Badge>)
              : '-'}
          </div>
        }
        dataTestId="provider-specialties"
      />
      <DataDisplay
        label={t('Biography')}
        content={provider.bio ?? '-'}
        size={'xl'}
        className="mb-4"
        dataTestId="provider-biography"
      />
    </div>
  );
}
