import { SubmitHandler, useForm } from 'react-hook-form';
import Button from '../../../components/button';
import TextInput from '../../../components/form/text-input';
import HeaderSubheader from '../../../components/header-subheader';
import Link from 'next/link';
import EmailPhoneSelector, {
  useEmailPhoneSelectorState,
} from '../../../components/email-phone-selector';
import { EmailXOrPhone } from '../../../hooks/useGetEmailPhoneFromQuery';
import { useState } from 'react';
import _ from 'lodash';
import FForm from '../../../components/f-form';
import { useAppStateContext } from '../../../state/context';
import DateInput from '../../../components/form/text-input/date-input';
import SingleCheckboxWidget from '../../flows/flow-engine/widgets/single-checkbox-widget';
import useTranslationStrings from '../../../hooks/useTranslationStrings';
import { Trans, useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { IdentityFormFields } from '../../forms/set-identity';
import parse from 'html-react-parser';
import { EnrollmentInfo } from 'api/auth/useGetEnrollmentInfo';
import { AccountIds } from 'api/account/useGetAccount';

export type RegisterFormFields = IdentityFormFields &
  EmailXOrPhone & {
    appConsent: boolean;
    anthemConsent?: boolean;
  };

export type IdentityQuestionKey = keyof IdentityFormFields;

export const IDENTITY_FIELDS: IdentityQuestionKey[] = [
  'firstName',
  'lastName',
  'birthday',
  'zipCode',
];

interface RegisterProps {
  defaultState?: Partial<RegisterFormFields>;
  onSubmit: (values: RegisterFormFields) => void;
  enrollmentInfo?: EnrollmentInfo;
}

export default function Register({ defaultState, onSubmit, enrollmentInfo }: RegisterProps) {
  const { t, ConsentToTermsDisclaimerAndPrivacy } = useTranslationStrings();
  const [loading, setLoading] = useState(false);
  const hint = enrollmentInfo?.hint;
  const form = useForm<RegisterFormFields>({
    mode: 'onChange',
    defaultValues: { ...defaultState, ...hint },
  });
  const emailPhoneSelectorState = useEmailPhoneSelectorState();
  const {
    appState: { auth },
  } = useAppStateContext();
  const isDelegate = auth?.loggedIn && auth.info.roles.includes('delegate');

  const handleSubmit: SubmitHandler<RegisterFormFields> = (values) => {
    setLoading(true);

    // This just makes sure we don't send both
    const payload =
      emailPhoneSelectorState.selected === 'phone'
        ? _.omit(values, 'email')
        : _.omit(values, 'phone');

    Promise.resolve(onSubmit(payload as RegisterFormFields)).finally(() => setLoading(false));
  };

  return (
    <FForm {...{ form, onSubmit: handleSubmit }}>
      <HeaderSubheader
        header={
          isDelegate
            ? t('CreatePatientFoodsmartAccount', 'Create a patient Foodsmart Account')
            : t('CreateYourFoodsmartAccount', 'Create your Foodsmart Account')
        }
        subheader={
          isDelegate ? (
            t(
              'StartByEnteringPatientInformation',
              "Start by entering the patient's information to create their account.",
            )
          ) : (
            <>
              {t('AlreadyHaveAnAccount', 'Already have an account?')}
              {` `}
              <Link
                href="/schedule/auth/login"
                className="font-medium text-f-dark-green hover:text-f-light-green"
              >
                {t('LoginHere', 'Login here')}
              </Link>
            </>
          )
        }
      />
      {!isDelegate && (
        <p className="text-base italic">
          {parse(
            t(
              'IfYouHaveAlreadyScheduledAnAppointmentYourselfOrOverThePhone',
              'If you have already scheduled an appointment yourself or over the phone with one of our agents, {{clickHereToLogin}}. If you have not previously scheduled an appointment yourself or over the phone, fill out the form below to create an account.',
              {
                clickHereToLogin: `
              <a
                href="/schedule/auth/login"
                class="font-medium text-f-dark-green hover:text-f-light-green"
              >
                ${t('ClickHereToLogin', 'Click here to login')}
              </a>`,
                interpolation: { escapeValue: false },
              },
            ),
          )}
        </p>
      )}
      {enrollmentInfo?.isEligible ? (
        <>
          <TextInput
            questionKey="memberId"
            widget="text"
            name={t('Member ID', 'Member ID')}
            registerOptions={{ required: true }}
          />
          <IdentityField field="birthday" />
        </>
      ) : (
        IDENTITY_FIELDS.filter((field) => !hint || hint[field]).map((field) => (
          <IdentityField key={field} field={field} readOnly={!!(hint && hint[field])} />
        ))
      )}
      <EmailPhoneSelector {...emailPhoneSelectorState} />
      {emailPhoneSelectorState.selected === 'phone' && (
        <p className="text-sm italic pb-2 -mt-1">
          <Trans>
            By providing a telephone number and submitting the form you are consenting to be
            contacted by SMS text message. Message & data rates may apply. Reply STOP to opt out of
            further messaging.
          </Trans>
        </p>
      )}
      {/* {!isDelegate && (
        <div className="text-lg">
          {t('AlreadyHaveAnAccount', 'Already have an account?')}
          {` `}
          <Link
            href="/schedule/auth/login"
            className="font-medium text-f-dark-green hover:text-f-light-green"
          >
            {t('LoginHere', 'Login here')}
          </Link>
        </div>
      )} */}
      {hint && (
        <div className="text-sm">
          {t('IsThisYou', 'Is this you?')}
          {` `}
          <Link href="/schedule" className="font-medium text-f-dark-green hover:text-f-light-green">
            {t('IfNotClickHere', 'If not, click here')}
          </Link>
        </div>
      )}

      {enrollmentInfo?.accountId === AccountIds.BankOfAmerica && (
        <SingleCheckboxWidget
          widget={{
            type: 'single-checkbox',
            defaultChecked: false,
            required: true,
            key: 'anthemConsent',
            value: 'true',
            label: t(
              'AnthemConsent',
              'By checking this box, you affirm that you are an active member with Anthem health insurance.',
            ),
          }}
          getFlowStateValue={() => null}
        />
      )}

      <SingleCheckboxWidget
        widget={{
          type: 'single-checkbox',
          defaultChecked: false,
          required: true,
          key: 'appConsent',
          value: 'true',
          label: ConsentToTermsDisclaimerAndPrivacy,
        }}
        getFlowStateValue={() => null}
      />

      <div className="flex justify-end">
        <Button size="large" loading={loading} type="submit" disabled={!form.formState.isValid}>
          {t('Next', 'Next')}
        </Button>
      </div>
    </FForm>
  );
}

type IdentityFieldProps = {
  field: IdentityQuestionKey;
  readOnly?: boolean;
};

function IdentityField({ field, readOnly }: IdentityFieldProps): JSX.Element {
  const { t } = useTranslation();
  switch (field) {
    case 'firstName':
      return (
        <TextInput
          name={t('FirstName', 'First Name')}
          questionKey="firstName"
          widget="text"
          readOnly={readOnly}
          registerOptions={{ required: true }}
        />
      );
    case 'lastName':
      return (
        <TextInput
          name={t('LastName', 'Last Name')}
          questionKey="lastName"
          widget="text"
          readOnly={readOnly}
          registerOptions={{ required: true }}
        />
      );
    case 'birthday':
      return (
        <DateInput
          name={t('Birthday', 'Birthday')}
          questionKey="birthday"
          readOnly={readOnly}
          registerOptions={{ required: true }}
          maxDate={{
            date: dayjs().subtract(18, 'years').toDate(),
            message: t(
              'MinDateFailureMessage',
              'You must be 18 or older the create an account. Please set up your account with a parent/guardian to schedule your first appointment.',
            ),
          }}
        />
      );
    case 'zipCode':
      return (
        <TextInput
          name={t('ZipCode', 'Zip Code')}
          questionKey="zipCode"
          widget="text:zipcode"
          readOnly={readOnly}
          registerOptions={{ required: true }}
        />
      );
  }
}
