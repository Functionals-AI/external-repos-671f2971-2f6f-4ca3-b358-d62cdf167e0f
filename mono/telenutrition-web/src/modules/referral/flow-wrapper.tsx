import { useEffect } from 'react';
import ReferralFlow from '../flows/scheduling/flows/referral-flow';
import Loading from '../../components/loading';
import { useModalManager } from '../modal/manager';
import { useTranslation } from 'react-i18next';
import useGetReferralFlow from '../../api/useGetReferralFlow';

export default function Referral() {
  const { error, isLoading, data } = useGetReferralFlow();
  const modalManager = useModalManager();
  const { t } = useTranslation();

  useEffect(() => {
    if (error && !modalManager.isOpen) {
      modalManager.openModal({
        type: 'Error',
        title: t('ErrorCreatingReferralFlow', 'Error creating referral flow'),
        subtitle: t('PleaseContactSupport', 'Please contact support'),
      });
    }
  }, [error]);

  if (isLoading || !data) {
    return <Loading />;
  }

  return (
    <ReferralFlow
      {...{
        flow: data.flow,
        initialFlowState: data.flowState,
      }}
    />
  );
}
