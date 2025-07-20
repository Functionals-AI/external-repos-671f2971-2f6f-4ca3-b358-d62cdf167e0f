import { UseGetProviderAppointmentsResult } from 'api/provider/useGetProviderAppointments';
import { HouseholdMemberWithSchedulingInfo, EncounterStatus, EncounterOversightStatus } from 'api/types';
import type { ProviderRecord } from '@mono/telenutrition/lib/types';
import { DateTime } from 'luxon';
import { okResponse } from '../responses';
import { createAppointmentRecord } from './appointment';
import { providerHouseholds } from './households';
import { UseGetProviderPatientResult } from 'api/provider/useGetProviderPatient';
import _ from 'lodash';
import { UseGetAppointmentSwappableProvidersReturn } from 'api/provider/useGetAppointmentSwappableProvider';
import { FetchProviderTasksResult } from 'api/provider/useFetchProviderTasks';
import { UseGetProviderTimezoneResult } from 'api/provider/useGetProviderTimezone';
import { FetchProviderMeResult } from 'api/provider/useFetchProviderMe';
import { GetProviderPatientsResult } from 'api/provider/useFetchProviderPatients';
import { FetchProviderSchedulingAnalyticsResult } from 'api/provider/useFetchProviderSchedulingAnalytics';
import { FetchProviderDepartmentPatientsResult } from 'api/provider/useFetchProviderDepartmentPatients';
import { UseFetchPatientProvidersResult } from 'api/useFetchPatientProviders';
import { FetchProviderOverbookingSlotsResult } from 'api/provider/useFetchProviderOverbookingSlots';
import {
  GroupedAppointmentsByProvider,
  UseGetAppointmentsReturn,
  ValidDurationsType,
} from '../../../src/api/useGetAppointments';

function mockGetPatient(mock: UseGetProviderPatientResult) {
  cy.intercept(
    {
      method: 'GET',
      url: `/telenutrition/api/v1/provider/patient?patientId=${mock.patient.patientId}`,
    },
    okResponse(mock),
  );
}

function mockGetSwappableProviders(
  appointmentId: number,
  mock: UseGetAppointmentSwappableProvidersReturn,
) {
  cy.intercept(
    {
      method: 'GET',
      url: `/telenutrition/api/v1/scheduling/appointments/${appointmentId}/swap-provider`,
    },
    okResponse(mock),
  );
}

function mockGetPatientProviders(patientId: number, mock: UseFetchPatientProvidersResult) {
  cy.intercept(
    {
      method: 'GET',
      url: `/telenutrition/api/v1/scheduling/patients/${patientId}/providers**`,
    },
    okResponse(mock),
  );
}

function mockGetSchedulingAppointments(mock: UseGetAppointmentsReturn) {
  cy.intercept(
    {
      method: 'GET',
      url: `/telenutrition/api/v1/scheduling/appointments**`,
    },
    okResponse(mock),
  );
}

function createPatients({ patientTimezone }: { patientTimezone?: string }) {
  return providerHouseholds.reduce((patients, household) => {
    return [
      ...patients,
      ...household.members.map((patient) => {
        const patientStripped = _.omit(
          patient,
          'nextSession',
          'lastSession',
          'canSchedule',
          'defaultPaymentMethod',
          'validAppointmentDurations',
        );
        if (patient.schedulingInfo.canSchedule) {
          const p: HouseholdMemberWithSchedulingInfo = {
            ...patientStripped,
            timezone: patientTimezone ?? patientStripped.timezone,
            schedulingInfo: {
              canSchedule: true,
              defaultPaymentMethod: patient.schedulingInfo.defaultPaymentMethod,
              patientPaymentMethods: [patient.schedulingInfo.defaultPaymentMethod],
              validAppointmentDurations: patient.schedulingInfo.validAppointmentDurations,
              canScheduleAudioOnly: { canSchedule: true, defaultValue: true },
            },
          };
          return p;
        } else {
          const p: HouseholdMemberWithSchedulingInfo = {
            ...patientStripped,
            timezone: patientTimezone ?? patientStripped.timezone,
            schedulingInfo: {
              canSchedule: false,
              errors: [
                {
                  type: 'error',
                  code: 'cannot-schedule',
                  message: 'Cannot schedule with this patient',
                },
              ],
            },
          };
          return p;
        }
      }),
    ];
  }, [] as HouseholdMemberWithSchedulingInfo[]);
}

export function setupProviderFixutre1({ now, timezone }: { now: DateTime; timezone: string }) {
  const mockProvider: ProviderRecord = {
    providerId: 123,
    firstName: 'Provider',
    lastName: 'Novcki',
    name: 'Provider Novicki',
    photo: '',
    initials: 'PN',
    certifications: [],
    specialtyIds: ['allergies', 'cardiology'],
    status: 3,
    homeEmail: 'home_email@g.com',
    email: 'work_email@g.com',
    homePhone: '+1 (144) 555 - 1422',
    timezone,
    languages: ['en', 'es'],
    homeZipcode: '52523',
    minPatientAge: 14,
    bio: 'Anta Baka',
  };

  const mockProvider1: ProviderRecord = {
    providerId: 124,
    firstName: 'Provider',
    lastName: 'Varrone',
    name: 'Provider Varrone',
    photo: '',
    initials: 'PV',
    certifications: [],
    specialtyIds: [],
    status: 3,
    timezone,
    minPatientAge: 14,
  };

  const getMockProviderAppointments: (
    now: DateTime,
    timezone: string,
  ) => UseGetProviderAppointmentsResult = (now, timezone) => ({
    departments: [
      {
        departmentId: 8,
        name: 'FOODSMART - AZ',
        state: 'AZ',
        timezone: 'America/Phoenix',
      },
      {
        departmentId: 9,
        name: 'FOODSMART - CA',
        state: 'CA',
        timezone: 'America/Los_Angeles',
      },
      {
        departmentId: 13,
        name: 'FOODSMART - FL',
        state: 'FL',
        timezone: 'America/New_York',
      },
      {
        departmentId: 16,
        name: 'FOODSMART - IA',
        state: 'IA',
        timezone: 'America/Chicago',
      },
      {
        departmentId: 25,
        name: 'FOODSMART - MN',
        state: 'MN',
        timezone: 'America/Chicago',
      },
      {
        departmentId: 36,
        name: 'FOODSMART - OR',
        state: 'OR',
        timezone: 'America/Los_Angeles',
      },
      {
        departmentId: 41,
        name: 'FOODSMART - TN',
        state: 'TN',
        timezone: 'America/Chicago',
      },
      {
        departmentId: 42,
        name: 'FOODSMART - TX',
        state: 'TX',
        timezone: 'America/Chicago',
      },
      {
        departmentId: 44,
        name: 'FOODSMART - VA',
        state: 'VA',
        timezone: 'America/New_York',
      },
      {
        departmentId: 47,
        name: 'FOODSMART - WI',
        state: 'WI',
        timezone: 'America/Chicago',
      },
      {
        departmentId: 50,
        name: 'FOODSMART - IL',
        state: 'IL',
        timezone: 'America/Chicago',
      },
    ],
    timezone: timezone,
    slots: [
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').minus({ days: 3 }).plus({ hours: 8 }),
        patient: providerHouseholds[0].members[0],
        status: '2',
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').minus({ days: 1 }).plus({ hours: 8 }),
        patient: providerHouseholds[0].members[0],
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.minus({ days: 1 }).startOf('day').plus({ hours: 16 }),
        patient: providerHouseholds[0].members[0],
        status: '3',
        encounter: {
          encounterId: 1000001,
          encounterStatus: EncounterStatus.Oversight,
          oversightStatus: EncounterOversightStatus.ProviderResponseRequired,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          oversightAt: new Date().toISOString(),
          oversightBy: 'Dr. Axe',
          oversightComment:
            'Please review this encounter, therre are some mistakes in the billing.',
        },
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ hours: 8 }),
        patient: providerHouseholds[0].members[0],
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ hours: 9 }),
        patient: providerHouseholds[0].members[0],
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ hours: 10 }),
        patient: providerHouseholds[0].members[0],
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ hours: 16 }),
        patient: providerHouseholds[0].members[0],
        status: '3',
        encounter: {
          encounterId: 1000002,
          encounterStatus: EncounterStatus.Oversight,
          oversightStatus: EncounterOversightStatus.PendingReview,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),

      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 1 }).plus({ hours: 8 }),
        patient: providerHouseholds[0].members[0],
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 2 }).plus({ hours: 8 }),
        status: 'o',
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 2 }).plus({ hours: 8, minutes: 30 }),
        status: 'o',
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 2 }).plus({ hours: 9 }),
        duration: 30,
        status: 'o',
        audioOnly: true,
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 2 }).plus({ hours: 9, minutes: 30 }),
        duration: 30,
        status: 'o',
        audioOnly: true,
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 3 }).plus({ hours: 9 }),
        patient: providerHouseholds[0].members[0],
        duration: 60,
        status: 'f',
        audioOnly: true,
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 3 }).plus({ hours: 9, minutes: 30 }),
        patient: providerHouseholds[0].members[1],
        duration: 30,
        status: 'f',
        audioOnly: true,
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 3 }).plus({ hours: 10 }),
        duration: 30,
        status: 'o',
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 3 }).plus({ hours: 10, minutes: 30 }),
        duration: 30,
        status: 'o',
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 3 }).plus({ hours: 11 }),
        duration: 30,
        status: 'o',
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 3 }).plus({ hours: 11 }),
        duration: 30,
        status: 'o',
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 4 }).plus({ hours: 11 }),
        duration: 60,
        status: 'f',
        patient: providerHouseholds[0].members[1],
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 1, hours: 12 }),
        duration: 30,
        status: 'o',
        appointmentId: 1000000,
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 1, hours: 12, minutes: 30 }),
        duration: 30,
        status: 'o',
        appointmentId: 1000001,
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 8 }).plus({ hours: 12 }),
        duration: 30,
        status: 'o',
        appointmentId: 1000002,
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 8 }).plus({ hours: 12, minutes: 30 }),
        duration: 30,
        status: 'o',
        appointmentId: 1000003,
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 15 }).plus({ hours: 12 }),
        duration: 30,

        status: 'o',
        appointmentId: 1000102,
      }),
      createAppointmentRecord({
        provider: mockProvider,
        dateTime: now.startOf('day').plus({ days: 15 }).plus({ hours: 12, minutes: 30 }),
        duration: 30,

        status: 'o',
        appointmentId: 1000103,
      }),
    ],
    provider: {
      name: 'Provider Novicki',
    },
  });

  cy.viewport(1200, 900);

  const mockProviderAppointments = getMockProviderAppointments(now, timezone);

  mockProviderAppointments.slots.forEach((appt) => {
    const recommendedSwap = {
      provider: mockProvider1,
      appointmentIds: [Math.floor(Math.random() * 10000), Math.floor(Math.random() * 10000)],
    };
    mockGetSwappableProviders(appt.appointmentId, {
      recommendedSwap: {
        provider: mockProvider1,
        appointmentIds: [Math.floor(Math.random() * 10000), Math.floor(Math.random() * 10000)],
      },
      allSwappable: [recommendedSwap],
    });
  });

  const patients = providerHouseholds.reduce((patients, household) => {
    return [
      ...patients,
      ...household.members.map((patient) => {
        const patientStripped = _.omit(
          patient,
          'nextSession',
          'lastSession',
          'canSchedule',
          'defaultPaymentMethod',
          'validAppointmentDurations',
        );
        if (patient.schedulingInfo.canSchedule) {
          const p: HouseholdMemberWithSchedulingInfo = {
            ...patientStripped,
            schedulingInfo: {
              canSchedule: true,
              defaultPaymentMethod: patient.schedulingInfo.defaultPaymentMethod,
              patientPaymentMethods: [patient.schedulingInfo.defaultPaymentMethod],
              validAppointmentDurations: patient.schedulingInfo.validAppointmentDurations,
              canScheduleAudioOnly: { canSchedule: true, defaultValue: true },
            },
          };
          return p;
        } else {
          const p: HouseholdMemberWithSchedulingInfo = {
            ...patientStripped,
            schedulingInfo: {
              canSchedule: false,
              errors: [
                {
                  type: 'error',
                  code: 'cannot-schedule',
                  message: 'Cannot schedule with this patient',
                },
              ],
            },
          };
          return p;
        }
      }),
    ];
  }, [] as HouseholdMemberWithSchedulingInfo[]);

  patients.forEach((patient) => {
    mockGetPatient({ patient });
    mockGetPatientProviders(patient.patientId, { providers: [mockProvider, mockProvider1] });
  });

  cy.intercept(
    {
      url: '/telenutrition/api/v1/provider/patients',
      method: 'GET',
    },
    okResponse<GetProviderPatientsResult>(providerHouseholds),
  );

  cy.intercept(
    {
      url: '/telenutrition/api/v1/provider/department-patients?query=*',
      method: 'GET',
    },
    okResponse<FetchProviderDepartmentPatientsResult>({
      patients: patients,
    }),
  );

  cy.intercept(
    {
      url: '/telenutrition/api/v1/provider/me',
      method: 'GET',
    },
    okResponse<FetchProviderMeResult>({
      provider: mockProvider,
      licenseSummary: { applications: [], licenses: [] },
      features: {
        canScheduleOverbookSlots: true,
      },
      intercomHash: 'fake',
    }),
  );

  cy.intercept(
    {
      method: 'GET',
      pathname: '/telenutrition/api/v1/provider/appointments',
    },
    okResponse<UseGetProviderAppointmentsResult>(mockProviderAppointments),
  );

  cy.intercept(
    {
      method: 'GET',
      url: '/telenutrition/api/v1/provider/timezone',
    },
    okResponse<UseGetProviderTimezoneResult>({ timezone }),
  );

  cy.intercept(
    {
      method: 'GET',
      url: '/telenutrition/api/v1/provider/tasks',
    },
    okResponse<FetchProviderTasksResult>({
      tasks: [
        {
          taskId: 123,
          name: 'First task for Provider Novicki',
          note: 'This is the details for the task',
          dueDate: '2024-08-01',
          providerId: mockProvider.providerId,
          priority: 'high',
          status: 'todo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }),
  );

  cy.intercept(
    {
      method: 'GET',
      url: '/telenutrition/api/v1/provider/scheduling-analytics?*',
    },
    okResponse<FetchProviderSchedulingAnalyticsResult>({
      analytics: {
        appointments: [
          {
            value: 10,
            theme: 'statusRed',
            label: 'Number of canceled visits',
          },
          {
            value: 2,
            theme: 'statusAmber',
            label: 'Number of rescheduled visits',
          },
        ],
      },
    }),
  );

  cy.intercept(
    {
      method: 'GET',
      url: `/telenutrition/api/v1/provider/${mockProvider.providerId}/appointments`,
    },
    okResponse<UseGetProviderAppointmentsResult>(mockProviderAppointments),
  );

  cy.intercept(
    {
      method: 'GET',
      url: '/telenutrition/api/v1/provider/overbooking/slots',
    },
    okResponse<FetchProviderOverbookingSlotsResult>({ vacancies: [] }),
  );

  return {
    providerHouseholds,
    provider: mockProvider,
    provider1: mockProvider1,
    providerAppointments: mockProviderAppointments,
    timezone,
  };
}

export function setupProvidersForSchedulingAppointments({
  now,
  timezone,
  patientTimezone,
}: {
  now: DateTime;
  timezone: string;
  patientTimezone: string;
}) {
  const mockProvider: ProviderRecord = {
    providerId: 123,
    firstName: 'Provider',
    lastName: 'Novcki',
    name: 'Provider Novicki',
    photo: '',
    initials: 'PN',
    certifications: [],
    specialtyIds: [],
    status: 3,
    homeEmail: 'home_email@g.com',
    email: 'work_email@g.com',
    homePhone: '+1 (144) 555 - 1422',
    timezone,
    languages: ['English', 'Spanish'],
    homeZipcode: '52523',
    minPatientAge: 14,
  };

  const mockProvider1: ProviderRecord = {
    providerId: 124,
    firstName: 'Provider',
    lastName: 'Meowmeowbobo',
    name: 'Provider Meowmeowbobo',
    photo: '',
    initials: 'PM',
    certifications: [],
    specialtyIds: [],
    status: 3,
    timezone,
    minPatientAge: 14,
  };

  const mockProvider2: ProviderRecord = {
    providerId: 125,
    firstName: 'Provider',
    lastName: 'Rei',
    name: 'Provider Rei',
    photo: '',
    initials: 'PR',
    certifications: [],
    specialtyIds: [],
    status: 3,
    timezone,
    minPatientAge: 14,
  };

  const slots: Record<string, GroupedAppointmentsByProvider[]> = {};
  const day1Key = now.toFormat('MM/dd/y');
  const day2 = now.plus({ day: 1, hour: 2 });
  const day2Key = day2.toFormat('MM/dd/y');
  slots[day1Key] = [
    {
      date: day1Key,
      appointments: [
        {
          startTimestamp: now.toISO()!,
          duration: 60,
          appointmentIds: [100, 101],
        },
      ],
      providerId: mockProvider.providerId,
    },
    {
      date: day1Key,
      appointments: [
        {
          startTimestamp: now.toISO()!,
          duration: 60,
          appointmentIds: [200, 201],
        },
      ],
      providerId: mockProvider1.providerId,
    },
  ];

  slots[day2Key] = [
    {
      date: day2Key,
      appointments: [
        {
          startTimestamp: day2.toISO()!,
          duration: 60,
          appointmentIds: [102, 103],
        },
      ],
      providerId: mockProvider.providerId,
    },
  ];
  const appointmentsReturn = {
    slots,
    providers: [mockProvider, mockProvider1, mockProvider2],
    timezone: 'America/Los_Angeles',
    validDurationsType: '60-only' as ValidDurationsType,
  };
  mockGetSchedulingAppointments(appointmentsReturn);

  const patients = createPatients({ patientTimezone });

  patients.forEach((patient) => {
    mockGetPatient({ patient });
    mockGetPatientProviders(patient.patientId, {
      providers: [mockProvider, mockProvider1, mockProvider2],
    });
  });

  cy.intercept(
    {
      url: '/telenutrition/api/v1/provider/patients',
      method: 'GET',
    },
    okResponse<GetProviderPatientsResult>([
      {
        ...providerHouseholds[0],
        members: patients,
      },
    ]),
  );

  cy.intercept(
    {
      url: '/telenutrition/api/v1/provider/department-patients?query=*',
      method: 'GET',
    },
    okResponse<FetchProviderDepartmentPatientsResult>({
      patients: patients,
    }),
  );

  cy.intercept(
    {
      url: '/telenutrition/api/v1/provider/me',
      method: 'GET',
    },
    okResponse<FetchProviderMeResult>({
      provider: mockProvider2,
      licenseSummary: { applications: [], licenses: [] },
      features: {
        canScheduleOverbookSlots: true,
      },
      intercomHash: 'fake',
    }),
  );

  cy.intercept(
    {
      method: 'GET',
      url: '/telenutrition/api/v1/provider/timezone',
    },
    okResponse<UseGetProviderTimezoneResult>({ timezone }),
  );

  cy.intercept(
    {
      method: 'GET',
      url: '/telenutrition/api/v1/provider/tasks',
    },
    okResponse<FetchProviderTasksResult>({
      tasks: [
        {
          taskId: 123,
          name: 'First task for Provider Novicki',
          note: 'This is the details for the task',
          dueDate: '2024-08-01',
          providerId: mockProvider.providerId,
          priority: 'high',
          status: 'todo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }),
  );
}
