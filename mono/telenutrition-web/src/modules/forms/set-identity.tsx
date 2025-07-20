import { SubmitHandler, useForm } from 'react-hook-form';
import Button from '../../components/button';
import TextInput from '../../components/form/text-input';
import HeaderSubheader from '../../components/header-subheader';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FForm from '../../components/f-form';
import DateInput from '../../components/form/text-input/date-input';
import dayjs from 'dayjs';

export type IdentityFormFields = {
  firstName: string;
  lastName: string;
  zipCode: string;
  birthday: string;
};

interface IdentityProps {
  defaultState?: Partial<IdentityFormFields>;
  onSubmit: (values: IdentityFormFields) => void;
}

export default function SetIdentityForm({ defaultState, onSubmit }: IdentityProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const form = useForm<IdentityFormFields>({ mode: 'onChange', defaultValues: defaultState });

  const handleSubmit: SubmitHandler<IdentityFormFields> = (values) => {
    setLoading(true);
    Promise.resolve(onSubmit(values)).finally(() => setLoading(false));
  };

  return (
    <FForm {...{ form, onSubmit: handleSubmit }}>
      <HeaderSubheader
        header={t('FinishSettingUpAccount', 'Finish setting up your Foodsmart Account')}
        subheader={t(
          'EnterInformationToCompleteRegistration',
          'Enter your information to complete your registration.',
        )}
      />
      <TextInput
        name={t('FirstName', 'First Name')}
        questionKey="firstName"
        widget="text"
        registerOptions={{ required: true }}
      />
      <TextInput
        name={t('LastName', 'Last Name')}
        questionKey="lastName"
        widget="text"
        registerOptions={{ required: true }}
      />
      <DateInput
        name={t('Birthday', 'Birthday')}
        questionKey="birthday"
        registerOptions={{ required: true }}
        maxDate={{
          date: dayjs().subtract(18, 'years').toDate(),
          message: t(
            'MinDateFailureMessage',
            'You must be 18 or older the create an account. Please set up your account with a parent/guardian to schedule your first appointment.',
          ),
        }}
      />
      <TextInput
        name={t('ZipCode', 'Zip Code')}
        questionKey="zipCode"
        widget="text:zipcode"
        registerOptions={{ required: true }}
      />
      <div className="flex justify-end">
        <Button size="large" loading={loading} type="submit" disabled={!form.formState.isValid}>
          {t('Submit', 'Submit')}
        </Button>
      </div>
    </FForm>
  );
}
