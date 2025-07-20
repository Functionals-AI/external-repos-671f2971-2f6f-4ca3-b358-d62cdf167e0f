import Section, { SectionDivider } from '@/ui-components/section';
import ProviderAppointmentSection from '@/smart-components/provider-appointment/provider-appointment-section';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { AppointmentRecord } from 'api/types';
import type { ProviderRecord } from '@mono/telenutrition/lib/types';
// import Card from '@/ui-components/card';
// import { FormV2 } from '@/modules/form/form';
// import { CameraIcon, CameraCrossedIcon } from '@/icons/camera';
import ChooseTimeslot from './choose-timeslot';
import FormComboBoxItem from '@/modules/form/form-combo-box';
import { useEffect } from 'react';
import { RescheduleCalendarFormFields } from '@/features/reschedule-calendar';
// import { SessionDuration, SessionType } from 'types/globals';

export enum RescheduleType {
  AnyDietitian = 'any_dietitian',
  SpecificDietitian = 'specific_dietitian',
}

export type RescheduleWithOtherRescheduleFields = RescheduleCalendarFormFields & {
  providerId: string;
  provider: ProviderRecord;
  // rescheduleType: RescheduleType;
  // duration: SessionDuration;
  // appointmentType: SessionType;
};

type RescheduleProps = {
  patientProviders: ProviderRecord[];
  rescheduleAppointment: AppointmentRecord;
};

export default function Reschedule({ patientProviders, rescheduleAppointment }: RescheduleProps) {
  const { form } = useMultiStepFormContext<RescheduleWithOtherRescheduleFields>();

  const providerId = form.watch('providerId');
  const provider = form.watch('provider');
  // const rescheduleType = form.watch('rescheduleType');

  useEffect(() => {
    if (providerId) {
      const provider = patientProviders.find((p) => `${p.providerId}` === providerId);
      if (!provider) return;
      form.setValue('provider', provider);
    }
  }, [providerId]);

  // useEffect(() => {
  //   if (rescheduleType === RescheduleType.AnyDietitian) {
  //     form.resetField('providerId');
  //     form.resetField('provider');
  //     form.resetField('timezoneDisplay');
  //     form.resetField('timeISO');
  //     form.resetField('date');
  //     form.resetField('newAppointmentIds');
  //   }
  // }, [rescheduleType]);

  // For now, on rescheduling, only allow same duration time.
  const isDurationDisabled = true;

  return (
    <>
      <ProviderAppointmentSection rescheduleAppointment={rescheduleAppointment} />
      <SectionDivider />
      <Section title="Updated session">
        {/* TODO: add this back in and send to API */}

        {/* <Card className="w-fit">
          <Card.Row>
            <Card.Row.Label className="w-32">Session type</Card.Row.Label>
            <Card.Row.Col className="px-2 py-1">
              <FormV2.FormButtonToggle
                dataTestId="session-type-button-toggle"
                id="appointmentType"
                form={form}
                className="col-span-2 w-48"
                // disabled={isSessionTypeDisabled}
                rules={{ required: true }}
                options={[
                  { icon: CameraIcon, value: SessionType.Video },
                  { icon: CameraCrossedIcon, value: SessionType.AudioOnly },
                ]}
              />
            </Card.Row.Col>
          </Card.Row>
          <Card.Row>
            <Card.Row.Label className="w-32">Duration</Card.Row.Label>
            <Card.Row.Col className="px-2 py-1">
              <FormV2.FormButtonToggle
                dataTestId="session-duration-button-toggle"
                id="duration"
                form={form}
                disabled={isDurationDisabled}
                defaultValue={
                  rescheduleAppointment.duration === 30
                    ? SessionDuration.Thirty
                    : SessionDuration.Sixty
                }
                className="col-span-2 w-48"
                rules={{ required: true }}
                options={[
                  {
                    name: '60 min',
                    value: SessionDuration.Sixty,
                  },
                  {
                    name: '30 min',
                    value: SessionDuration.Thirty,
                  },
                ]}
              />
            </Card.Row.Col>
          </Card.Row>
        </Card> */}
        {/* <RadioGroup form={form} id="rescheduleType" rules={{ required: true }}>
          <RadioGroup.Item value={RescheduleType.AnyDietitian} title={t('Any dietitian')} />
          <RadioGroup.Item
            value={RescheduleType.SpecificDietitian}
            title={t('Specific dietitian')}
          />
        </RadioGroup> */}
        {/* {rescheduleType === RescheduleType.SpecificDietitian && ( */}
        {/* <> */}
        <FormComboBoxItem
          form={form}
          id="providerId"
          label="Dietitian"
          rules={{ required: true }}
          options={patientProviders.map((provider) => ({
            label: provider.name,
            value: `${provider.providerId}`,
          }))}
        />
        {provider && (
          <ChooseTimeslot
            form={form}
            provider={provider}
            rescheduleAppointment={rescheduleAppointment}
          />
        )}
        {/* </> */}
        {/* )} */}
      </Section>
    </>
  );
}
