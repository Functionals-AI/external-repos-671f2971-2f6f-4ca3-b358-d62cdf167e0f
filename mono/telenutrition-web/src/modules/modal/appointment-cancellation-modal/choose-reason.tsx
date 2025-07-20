import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Loading from '../../../components/loading';
import Button from '../../../components/button';
import usePutCancelAppointment, { AppointmentCancelReason } from '../../../api/usePutCancelAppointment';
import ReasonSelector from '../../provider/dashboard/reason-selector';

interface ChooseReasonProps {
  appointmentId: number;
  forcedCancelReason?: AppointmentCancelReason;
  onSuccess: () => void;
  onCancel: () => void;
  onFail: (err: any) => void;
}

export default function ChooseReason({
  appointmentId,
  forcedCancelReason,
  onSuccess,
  onCancel,
  onFail,
}: ChooseReasonProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<AppointmentCancelReason>(forcedCancelReason ?? 'PROVIDER_UNAVAILABLE');
  const {
    post: putCancelAppointment,
    data: { isSubmitting },
  } = usePutCancelAppointment({
    appointmentId,
  });
  if (isSubmitting) return <Loading />;
  return (
    <>
      <p className="text-lg my-4">
        {t('ChooseOneOfTheReasonsForCancellation', 'Choose one of the reasons for cancellation.')}
      </p>
      <div className="flex flex-col border-green">
        {/* disable if cancelReason given to modal in payload */}
        <ReasonSelector disabled={!!forcedCancelReason} reason={reason} setReason={setReason} />
      </div>
      <div className="flex justify-between my-6 px-4 max-w-sm mx-auto">
        <Button theme="destructive" size="large" onClick={onCancel} variant="secondary">
          {t('Close', 'Close')}
        </Button>
        <Button
          size="large"
          theme="destructive"
          onClick={() => {
            putCancelAppointment({ payload: { cancelReason: reason } })
              .then(() => {
                onSuccess();
              })
              .catch((err) => {
                onFail(err);
              });
          }}
        >
          {t('Cancelappointment', 'Cancel appointment')}
        </Button>
      </div>
    </>
  );
}
