import { FormV2 } from '@/modules/form/form';
import Section from '@/ui-components/section';
import useFormConsts from 'hooks/useFormConsts';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PatientProfile } from './util';
import { getSizeClassName } from '@/modules/widgets/widget-label';

export function PatientEditOverviewFormFieldsSection({
  form,
}: {
  form: UseFormReturn<PatientProfile>;
}) {
  const { t } = useTranslation();
  const { states, sexes, pronouns } = useFormConsts();

  return (
    <Section title={t('Overview')}>
      <Section.ContentBasicMaxWidth className="flex flex-row flex-wrap gap-4">
        <FormV2.FormTextInput
          form={form}
          id="firstName"
          label={t('Legal first name')}
          rules={{ required: true }}
          className={getSizeClassName('md')}
        />
        <FormV2.FormTextInput
          form={form}
          id="lastName"
          label={t('Legal last name')}
          rules={{ required: true }}
          className={getSizeClassName('md')}
        />
        <FormV2.FormTextInput
          form={form}
          id="preferredName"
          label={t('Preferred name')}
          className={getSizeClassName('md')}
        />
        <FormV2.FormDatePickerItem
          form={form}
          id="birthday"
          inputLabel={t('Birthday')}
          rules={{ required: true }}
          className={getSizeClassName('md')}
        />
        <FormV2.FormSelectItem
          form={form}
          id="sex"
          label={t('Sex')}
          options={sexes}
          rules={{ required: true }}
          className={getSizeClassName('md')}
        />
        <FormV2.FormSelectItem
          form={form}
          id="pronouns"
          label={t('Pronouns')}
          options={pronouns}
          className={getSizeClassName('md')}
        />
        <FormV2.FormTextInput
          form={form}
          id="address1"
          label={t('Street address')}
          rules={{ required: true }}
          className={getSizeClassName('lg')}
        />
        <FormV2.FormTextInput
          form={form}
          id="city"
          label={t('City')}
          className={getSizeClassName('md')}
        />
        <FormV2.FormSelectItem
          form={form}
          id="state"
          label={t('State')}
          options={states}
          rules={{ required: true }}
          className={getSizeClassName('md')}
        />
        <FormV2.FormNumberInput
          form={form}
          id="zipcode"
          label={t('Postal code')}
          rules={{ required: true }}
          decimalScale={0}
          className={getSizeClassName('sm')}
        />
      </Section.ContentBasicMaxWidth>
    </Section>
  );
}

export function PatientEditContactFormFieldsSection({
  form,
}: {
  form: UseFormReturn<PatientProfile>;
}) {
  const { t } = useTranslation();

  return (
    <Section title={t('Contact')}>
      <FormV2.FormPhoneInput
        className={getSizeClassName('md')}
        form={form}
        id="phone"
        label={t('Phone number')}
      />
      <FormV2.FormTextInput
        className={getSizeClassName('lg')}
        form={form}
        id="email"
        label={t('Email')}
      />
    </Section>
  );
}
