import { UseFormReturn } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import FormItem from '@/modules/form/form-item';
import { Input as BaseInput } from '@/ui-components/form/input';
import { PatientFiltersFields } from './index';
import { Button } from '@/ui-components/button';
import FormFilterSelect from '@/modules/form/form-filter-select';
import Icon from '@/ui-components/icons/Icon';
import { PatientPaymentMethod } from '../../../api/types';

interface Props {
  form: UseFormReturn<PatientFiltersFields>;
  paymentMethods: PatientPaymentMethod[];
}

export function PatientFilters({ form, paymentMethods }: Props) {
  const { t } = useTranslation();

  const paymentMethodOptions = paymentMethods.map((pm) => ({
    label: pm.label,
    value: pm.id,
  }));

  form.watch();

  return (
    <div>
      <div className="w-96 mb-2">
        <FormItem
          form={form}
          className="md:col-span-2"
          id="searchText"
          rules={{ required: true }}
          renderItem={(field) => (
            <div className="flex">
              <Icon name="search" className="mr-2" />
              <BaseInput placeholder={t('Search ID or name (Last, First)')} {...field} />
            </div>
          )}
        />
      </div>
      <div className="flex justify-start items-center">
        <span className="text-neutral-600 mr-4">
          <Trans>Filters</Trans>
        </span>
        <div className="mr-3">
          <FormFilterSelect
            id="paymentMethodTypeIds"
            form={form}
            label={t('Coverage')}
            options={paymentMethodOptions}
            multiple
            showSearch
          />
        </div>
        <FormFilterSelect
          id="daysSinceLastSession"
          form={form}
          label={t('Last visit')}
          options={[
            {
              label: t('Last 7 days'),
              value: 7,
            },
            {
              label: t('Last 14 days'),
              value: 14,
            },
            {
              label: t('Last 30 days'),
              value: 30,
            },
            {
              label: t('Last 90 days'),
              value: 90,
            },
          ]}
        />
        <Button
          className="m-2"
          variant="tertiary"
          size="sm"
          onClick={() => {
            form.reset({
              searchText: '',
              paymentMethodTypeIds: [],
            });
          }}
        >
          <Trans>Clear filters</Trans>
        </Button>
      </div>
    </div>
  );
}
