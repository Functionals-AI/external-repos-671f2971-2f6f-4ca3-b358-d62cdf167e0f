import { useForm } from 'react-hook-form';
import Modal from './modal';
import { ModalProps } from './types';
import SingleCheckboxWidget from '../../modules/flows/flow-engine/widgets/single-checkbox-widget';
import useTranslationStrings from '../../hooks/useTranslationStrings';
import usePostAccountConsent from '../../api/account/usePostAccountConsent';
import { useModalManager } from './manager';
import FForm from '../../components/f-form';
import HeaderSubheader from '../../components/header-subheader';
import Button from '../../components/button';
import { useAppStateContext } from '../../state/context';

export default function RequireAppConsentModal({
  isOpen,
  closeModal: defaultCloseModal,
}: ModalProps) {
  const form = useForm({ mode: 'onChange' });
  const { closeModal } = useModalManager();
  const { t, ConsentToTermsDisclaimerAndPrivacy } = useTranslationStrings();
  const {
    post: postAccountConsent,
    data: { isSubmitting },
  } = usePostAccountConsent();
  const { dispatch } = useAppStateContext();

  const onSubmit = () => {
    postAccountConsent({ payload: { appConsent: true } }).then(() => {
      dispatch({ type: 'APP_CONSENT_SUCCESS' });
      closeModal();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={defaultCloseModal}>
      <FForm form={form} onSubmit={onSubmit} layoutWidth="large">
        <HeaderSubheader header={t('UserConsentRequired', 'User Consent Required')} />
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
        <Button loading={isSubmitting} disabled={!form.formState.isValid} type="submit">
          {t('Continue', 'Continue')}
        </Button>
      </FForm>
    </Modal>
  );
}
