import { FetchAppointmentEncounterInfoResult } from 'api/encounter/useFetchAppointmentEncounterInfo';
import { EncounterOversightStatus, EncounterStatus, ExtendedAppEncounterData, PatientPaymentMethod } from 'api/types';
import { DateTime } from 'luxon';
import chartingConfig from './encounter-charting-config-v1';
import { AudioSupport, PaymentCoverage } from '@mono/telenutrition/lib/types';

// Charting V1

type Base = {
  oversightRequired?: boolean;
  startTimestamp: DateTime;
  rawData?: Record<string, any>;
};

type Props = Base &
  (
    | { appointmentStatus: 'f' }
    | { appointmentStatus: '2' }
    | { appointmentStatus: '3'; encounterStatus: EncounterStatus.Closed }
    | {
        appointmentStatus: '3';
        encounterStatus: EncounterStatus.Oversight;
        oversightStatus: EncounterOversightStatus.ProviderResponseRequired;
        oversight: {
          by: string;
          at: DateTime;
          comment: string;
        };
      }
  );

export const generatePaymentMethod = (
  props: {
    id?: number;
    name?: string;
    memberId?: string;
    patientId?: number;
    isValid?: boolean;
    followupDuration?: number;
    audioSupport?: AudioSupport;
    oversightRequired?: boolean;
    coverage?: PaymentCoverage;
  } = {},
): PatientPaymentMethod => {
  const { id, patientId, isValid, followupDuration, audioSupport, oversightRequired, coverage } =
    props;
  const name = props.name ?? 'Independent Health';
  const memberId = props.memberId ?? 'abc123';
  const label = `${name} (${memberId})`;
  return {
    id: id ?? 1,
    patientId: patientId ?? 10000000,
    label,
    memberId,
    payment: {
      method: 'plan',
      insurance_id: 8,
      member_id: memberId,
    },
    lastUsed: '2024-05-08T15:08:26.402Z',
    type: {
      id: 8,
      label: name,
      method: 'plan',
      insuranceId: 8,
      audioSupport: audioSupport ?? 'default',
      followUpDurations: [followupDuration ?? 60],
      eligibilityCheckType: 'none',
      eligibilityOptional: false,
    },
    isValid: isValid ?? true,
    status: 'unchecked',
    oversightRequired: !!oversightRequired,
    coverage,
  };
};

export const encounterResponse = (props: Props): FetchAppointmentEncounterInfoResult => {
  const oversightRequired = props.oversightRequired ?? false;
  const encounterData: FetchAppointmentEncounterInfoResult['encounterData'] = (() => {
    if (
      props.appointmentStatus === 'f' ||
      props.appointmentStatus === '2' ||
      (props.appointmentStatus === '3' &&
        props.encounterStatus === EncounterStatus.Oversight &&
        props.oversightStatus === EncounterOversightStatus.ProviderResponseRequired)
    ) {
      const data: ExtendedAppEncounterData = {
        type: 'app' as const,
        oversightRequired,
        chartingConfig: chartingConfig,
        encounter:
          props.appointmentStatus === 'f'
            ? null
            : {
                encounterId: 1000022,
                patientId: 10000000,
                appointmentId: 100000082,
                departmentId: 9,
                providerId: 1,
                encounterType: 'visit',
                encounterDate: '2024-10-08T00:00:00.000Z',
                encounterStatus:
                  props.appointmentStatus === '2' ? EncounterStatus.Open : props.encounterStatus,
                oversightStatus: props.appointmentStatus !== '3' ? EncounterOversightStatus.PendingReview : props.oversightStatus,
                createdBy: 'Kate Schlag, RD',
                specialty: 'Registered Dietitian Nutritionist',
                lastModified: '2024-10-08T18:56:30.158+00:00',
                specialtyId: undefined,
                diagnosisCode: undefined,
                createdAt: '2024-10-08T17:00:29.838+00:00',
                updatedAt: '2024-10-08T18:56:30.158+00:00',
                rawData: props.rawData ?? {},
                ...(props.appointmentStatus === '3' && {
                  oversightAt: props.oversight.at.toISO()!,
                  oversightBy: props.oversight.by,
                  oversightComment: props.oversight.comment,
                }),
              },
      };

      return data;
    }

    if (props.appointmentStatus === '3' && props.encounterStatus === EncounterStatus.Closed) {
      return {
        type: 'app-complete' as const,
        encounter: {
          encounterId: 1000022,
          patientId: 10000000,
          appointmentId: 100000082,
          departmentId: 9,
          providerId: 1,
          actualStarttime: '2024-05-15T12:02:30.000Z',
          actualEndtime: '2024-05-15T12:35:20.000Z',
          encounterType: 'visit',
          encounterDate: '2024-05-15T00:00:00.000Z',
          encounterStatus: EncounterStatus.Closed,
          createdBy: 'Kate Schlag, RD',
          specialty: 'Registered Dietitian Nutritionist',
          lastModified: '2024-10-08T18:56:30.158+00:00',
          specialtyId: '071',
          diagnosisCode: 'Z71.3',
          unitsBilled: 4,
          billingCode: '99212',
          createdAt: '2024-10-08T17:00:29.838+00:00',
          updatedAt: '2024-10-08T18:56:30.158+00:00',
          rawData: props.rawData ?? {},
        },
        displayChartingData: [],
      };
    }

    throw new Error('Encounter data not implemented');
  })();

  const paymentMethod = generatePaymentMethod();
  const paymentMethod2 = generatePaymentMethod({
    id: 2,
    name: 'Bobo healthcare',
    memberId: '42069',
    isValid: false,
    followupDuration: 30,
    audioSupport: 'never',
    oversightRequired: true,
    coverage: {
      remaining: 3,
      limit: 6,
      year: 2034,
    },
  });

  return {
    appointmentDetails: {
      appointment: {
        appointmentId: 100000082,
        appointmentTypeId: 341,
        departmentId: 9,
        patientId: 10000000,
        providerId: 1,
        duration: 60,
        status: props.appointmentStatus,
        startDate: props.startTimestamp.toFormat('LL/dd/yyyy'), //'05/15/2024',
        startTime: '9:00 AM PDT',
        frozen: false,
        date: props.startTimestamp.toFormat('LL/dd/yyyy'), // '05/13/2024',
        startAt: props.startTimestamp.toISO()!, // '2024-05-13T12:00:00.000Z',
        userId: 1,
        startTimestamp: props.startTimestamp.toISO()!, // '2024-05-13T12:00:00.000Z',
        paymentMethodId: 1,
        isAudioOnly: true,
        appointmentTypeDisplay: 'Audio Only Follow Up 60',
        isFollowUp: true,
        patient: {
          patientId: 10000000,
          departmentId: 9,
          identityId: 1,
          state: 'CA',
          address1: 'ABC 123',
          city: 'Louisville',
          sex: 'M',
          phone: '+15022253532',
          email: 'conner.novicki+1@foodsmart.com',
          timezone: 'America/Los_Angeles',
          firstName: 'Conner',
          lastName: 'Novicki',
          birthday: '1990-12-07',
          zipcode: '12345',
          accountEmail: 'conner.novicki+1@foodsmart.com',
        },
      },
      providerName: 'Kate Schlag, RD',
      hasNutriquiz: false,
      paymentMethod,
      patientPaymentMethods: [paymentMethod, paymentMethod2],
    },
    questionnaires: [],
    encounterData,
  };
};
