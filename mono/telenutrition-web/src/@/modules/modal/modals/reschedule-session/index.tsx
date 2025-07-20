import Modal from '@/modules/modal/ui/modal';
import Wizard from 'components/wizard';
import WizardSteps from 'components/wizard/wizard-steps';
import RescheduleOption, { RescheduleOptionFields, RescheduleTypeValue } from './reschedule-option';
import { RescheduleSessionModalData } from '../../types';
import RescheduleWithOtherMultiStepForm from './flows/reschedule-with-other';
import RescheduleWithSelfMultiStepForm from './flows/reschedule-with-self';
import RescheduleWithOtherNoSwapMultiStepForm from './flows/reschedule-with-other-no-swap';

export type RescheduleSessionModalFields = RescheduleOptionFields;

export default function RescheduleSessionModal({
  rescheduleAppointment,
}: RescheduleSessionModalData) {
  return (
    <Modal size="lg">
      <Wizard
        flowName="reschedule_session"
        start="select-option"
        ignorePostEvent
        initialState={{} as RescheduleSessionModalFields}
        steps={{
          'select-option': {
            render: ({ goTo }) => (
              <RescheduleOption
                rescheduleAppointment={rescheduleAppointment}
                onSubmit={(values) => {
                  if (values.rescheduleType === RescheduleTypeValue.RESCHEDULE_WITH_ME) {
                    goTo('reschedule-with-self', {
                      updateState: (s) => ({ ...s, ...values }),
                    });
                  } else if (
                    values.rescheduleType ===
                    RescheduleTypeValue.RESCHEDULE_WITH_SOMEONE_ELSE_NO_SWAP
                  ) {
                    goTo('reschedule-with-other-no-swap', {
                      updateState: (s) => ({ ...s, ...values }),
                    });
                  } else {
                    goTo('reschedule-with-other', {
                      updateState: (s) => ({ ...s, ...values }),
                    });
                  }
                }}
              />
            ),
          },
          'reschedule-with-self': {
            render: ({ goBack }) => (
              <RescheduleWithSelfMultiStepForm
                onBack={() => goBack()}
                rescheduleAppointment={rescheduleAppointment}
              />
            ),
          },
          'reschedule-with-other': {
            render: ({ goBack }) => (
              <RescheduleWithOtherMultiStepForm
                onBack={() => goBack()}
                rescheduleAppointment={rescheduleAppointment}
              />
            ),
          },
          'reschedule-with-other-no-swap': {
            render: ({ goBack }) => (
              <RescheduleWithOtherNoSwapMultiStepForm
                onBack={() => goBack()}
                rescheduleAppointment={rescheduleAppointment}
              />
            ),
          },
        }}
      >
        <WizardSteps />
      </Wizard>
    </Modal>
  );
}
