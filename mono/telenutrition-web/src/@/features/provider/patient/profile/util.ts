import { IsoDateString } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import useFormConsts from 'hooks/useFormConsts';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

export type Demographic = Omit<PatientRecord, 'patientId' | 'departmentId' | 'timezone'>;

interface BaseField {
  type: 'text' | 'select';
  className?: string;
  id: string;
  label: string;
  rules?: any;
}

interface BaseInputField extends BaseField {
  type: 'text';
}

interface SelectField extends BaseField {
  type: 'select';
  options: { label: string; value: string }[];
}

export type InputField = BaseInputField | SelectField;

export type HealthVitals = {
  heightF?: number;
  heightI?: number;
  conditions: string[];
};

export type PatientProfile = Demographic & HealthVitals;
export type PatientProfileField = keyof PatientProfile;

export const CONDITION_OPTIONS = new Array(10).fill(0).map((_, ind) => ({
  value: `${ind + 1}`,
  label: `option${ind + 1}`,
}));

export const useDemographicFields = (): InputField[] => {
  const { t } = useTranslation();
  const { states, sexes, religions, languages, pronouns } = useFormConsts();
  return [
    {
      type: 'text',
      className: 'col-span-5',
      id: 'firstName',
      label: t('Legal first name'),
      rules: { required: true },
    },
    {
      type: 'text',
      className: 'col-span-5',
      id: 'lastName',
      label: t('Legal last name'),
      rules: { required: true },
    },
    {
      type: 'text',
      className: 'col-span-8',
      id: 'preferredName',
      label: t('Preferred name'),
    },
    {
      type: 'select',
      className: 'col-span-5',
      id: 'sex',
      label: t('Sex'),
      rules: { required: true },
      options: sexes,
    },
    {
      type: 'select',
      className: 'col-span-5',
      id: 'pronouns',
      label: t('Pronouns'),
      options: pronouns,
    },
    {
      type: 'select',
      className: 'col-span-5',
      id: 'language',
      label: t('Language preference'),
      options: languages,
    },
    {
      type: 'select',
      className: 'col-span-5',
      id: 'religion',
      label: t('Religion'),
      options: religions,
    },
    {
      type: 'text',
      className: 'col-span-5',
      id: 'birthday',
      label: t('Birthday'),
    },
    {
      type: 'text',
      className: 'col-span-10',
      id: 'address1',
      label: t('Street address'),
      rules: { required: true },
    },
    {
      type: 'text',
      className: 'col-span-5',
      id: 'city',
      label: t('City'),
      rules: { required: true },
    },
    {
      type: 'select',
      className: 'col-span-5',
      id: 'state',
      label: t('State'),
      rules: { required: true },
      options: states,
    },
    {
      type: 'text',
      className: 'col-span-2',
      id: 'zipcode',
      label: t('Postal code'),
      rules: { required: true },
    },
  ];
};

export const getContactFields = (t: TFunction): InputField[] => [
  {
    type: 'text',
    className: 'col-span-5',
    id: 'phone',
    label: t('Phone number'),
    rules: { required: true },
  },
  {
    type: 'text',
    className: 'col-span-10',
    id: 'email',
    label: t('Email'),
    rules: { required: true },
  },
];

export const MOCK_DATA: PatientProfile = {
  firstName: 'Michael',
  lastName: 'Varrone',
  sex: 'M',
  preferredName: 'Michael Steven Varrone',
  birthday: '1990-01-01' as IsoDateString,
  phone: '+1 234 567 789',
  email: 'michael.varrone+001@foodsmart.com',
  address1: '2002 Ponderosa St',
  city: 'Santa Ana',
  state: 'CA',
  zipcode: '92705',
  heightF: 5,
  heightI: 10,
  conditions: ['1', '3', '5', '7', '9'],
};

const Utils = {
  useDemographicFields,
};

export default Utils;
