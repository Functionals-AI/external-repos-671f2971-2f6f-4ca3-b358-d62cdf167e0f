import { SubmitHandler, useForm } from 'react-hook-form';
import CustomFormProvider from '../../components/form/custom-form-provider';
import Modal from './modal';
import { ModalProps } from './types';
import Button from '../../components/button';
import TextInput from '../../components/form/text-input';
import usePatchUpdateAccount from '../../api/account/usePatchUpdateAccount';
import { UpdateAccountInfoModalState } from '../../state/types/modal';
import dayjs from 'dayjs';
import HeaderSubheader from '../../components/header-subheader';
import { useAppStateContext } from '../../state/context';
import Alert from '../../components/alert';
import { useTranslation } from 'react-i18next';
import { useModalManager } from './manager';
import DateInput from '../../components/form/text-input/date-input';

interface UpdateAccountInfoModalFormFields {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthday: string;
  zipCode: string;
}

export default function UpdateAccountInfoModal({
  isOpen,
  closeModal,
  payload,
}: ModalProps<UpdateAccountInfoModalState>) {
  const { t } = useTranslation();
  const modalManager = useModalManager();
  const form = useForm<UpdateAccountInfoModalFormFields>({
    mode: 'onChange',
    defaultValues: {
      firstName: payload.currentAccountFields.firstName,
      lastName: payload.currentAccountFields.lastName,
      birthday: dayjs(payload.currentAccountFields.birthday).format('MM/DD/YYYY'),
      zipCode: payload.currentAccountFields.zipCode,
      ...(payload.currentAccountFields.email && { email: payload.currentAccountFields.email }),
      ...(payload.currentAccountFields.phone && { phone: payload.currentAccountFields.phone }),
    },
  });
  const { dispatch } = useAppStateContext();

  const {
    post: patchUpdateAccount,
    data: { isSubmitting, error },
    resetData,
  } = usePatchUpdateAccount();

  const onSubmit: SubmitHandler<UpdateAccountInfoModalFormFields> = (values) => {
    const { firstName, lastName, zipCode } = values;

    patchUpdateAccount({ payload: { firstName, lastName, zipCode } })
      .then(({ data }) => {
        dispatch({ type: 'APP_USER_FETCHED', payload: data });
        closeModal();
      })
      .catch((e) => {
        modalManager.handleApiError({
          error: e,
          subtitle: t('ErrorUpdatingYourAccount', 'Error updating your account.'),
        });
      });
  };

  return (
    <Modal {...{ isOpen, onClose: closeModal, modalClassName: 'w-full max-w-2xl' }}>
      <CustomFormProvider form={form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          {error && (
            <Alert
              title={t('ErrorUpdatingAccount', 'Error Updating Account')}
              subtitle={error.message}
              onClose={() => resetData()}
            />
          )}
          <HeaderSubheader header={t('UpdateAccountInfo', 'Update Account Info')} />
          <TextInput
            questionKey="firstName"
            name={t('FirstName', 'First Name')}
            registerOptions={{ required: true }}
            widget="text"
          />
          <TextInput
            questionKey="lastName"
            name={t('LastName', 'Last Name')}
            registerOptions={{ required: true }}
            widget="text"
          />
          {payload.currentAccountFields.email && (
            <TextInput
              readOnly
              questionKey="email"
              name={t('Email', 'Email')}
              registerOptions={{ required: !!payload.currentAccountFields.email }}
              widget="text:email"
            />
          )}
          {payload.currentAccountFields.phone && (
            <TextInput
              readOnly
              questionKey="phone"
              name={t('Phone', 'Phone')}
              registerOptions={{ required: !!payload.currentAccountFields.phone }}
              widget="text:phone"
            />
          )}
          <DateInput
            readOnly
            questionKey="birthday"
            name={t('Birthday', 'Birthday')}
            registerOptions={{ required: true }}
          />
          <TextInput
            questionKey="zipCode"
            name={t('ZipCode', 'Zip Code')}
            registerOptions={{ required: true }}
            widget="text:zipcode"
          />
          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting} disabled={!form.formState.isValid}>
              {t('UpdateAccount', 'Update Account')}
            </Button>
          </div>
        </form>
      </CustomFormProvider>
    </Modal>
  );
}
