import {
  AppointmentRecord,
  HouseholdMemberNonSchedulableInfo,
  HouseholdMemberWithSchedulingInfo,
  ProviderScheduleForPatientDisallowReason,
} from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import usePiiManager from '../pii-manager/usePiiManager';
import { useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

type UnschedulableDisplay = {
  type: 'unschedulable';
  shortError?: string;
  fullError?: string[];
};

type SchedulabilityDisplay =
  | {
      type: 'schedulable';
    }
  | UnschedulableDisplay;

export default function useMemberHelpers() {
  const pii = usePiiManager();
  const { t } = useTranslation();

  function getDisplayNameFromAppointment({
    appointment,
  }: {
    appointment: AppointmentRecord;
  }): string {
    if (!appointment.patient) {
      return appointment.patientId ? `ID: ${pii.wrap(`${appointment.patientId}`)}` : t('Member');
    }

    const { patient } = appointment;

    if (patient.preferredName) return pii.wrap(patient.preferredName);
    else return pii.wrap(`${patient.firstName ?? '-'} ${patient.lastName ?? '-'}`);
  }

  function getDisplayNameForPatient(
    patient: Pick<PatientRecord, 'firstName' | 'lastName' | 'preferredName'>,
    options?: { format: 'first last' | 'last, first' },
  ): { label: string; value: string } {
    if (patient.preferredName) {
      return {
        label: t('Preferred name'),
        value: pii.wrap(patient.preferredName),
      };
    }

    const names =
      options?.format === 'last, first'
        ? [patient.lastName ?? '-', patient.firstName ?? '-'].join(', ')
        : [patient.firstName ?? '-', patient.lastName ?? '-'].join(' ');

    return { label: t('Name'), value: pii.wrap(names) };
  }

  function getMemberAge(patient: PatientRecord): number | null {
    if (!patient.birthday) {
      return null;
    }

    return Math.floor(-DateTime.fromISO(patient.birthday).diffNow('years').years)
  }

  function getDisplayBirthday(patient: PatientRecord): string {
    if (!patient.birthday) {
      return '';
    }

    return pii.wrap(new Date(patient.birthday).toLocaleDateString());
  }

  function getDisplaySex(patient: PatientRecord): string | undefined {
    if (patient.sex === 'M') return t('Male');
    if (patient.sex === 'F') return t('Female');

    return undefined;
  }

  function getDisplayAddressLines(patient: PatientRecord): string[] {
    return [
      [patient.address1, patient.address2].filter((line) => !!line).join(' '),
      [patient.city, patient.state, patient.zipcode].filter((line) => !!line?.trim()).join(', '),
    ].filter((line) => !!line);
  }

  function getSchedulabilityDisplay(
    schedulingInfo: HouseholdMemberWithSchedulingInfo['schedulingInfo'],
  ): SchedulabilityDisplay {
    if (schedulingInfo.canSchedule) return { type: 'schedulable' };
    return getErrorSchedulabilityDisplay(schedulingInfo);
  }

  function getErrorSchedulabilityDisplay(
    schedulingInfo: HouseholdMemberNonSchedulableInfo,
  ): UnschedulableDisplay {
    function getErrorDisplays(error: ProviderScheduleForPatientDisallowReason) {
      if (error.type === 'disallowed') {
        return { short: error.reasonShort, full: error.reasonFull };
      }
      return {
        short: error.code,
        full: error.message,
      };
    }

    if (schedulingInfo.errors.length == 0) return { type: 'unschedulable' };
    if (schedulingInfo.errors.length == 1) {
      const e = getErrorDisplays(schedulingInfo.errors[0]);
      return { type: 'unschedulable', shortError: e.short, fullError: [e.full] };
    }

    return {
      type: 'unschedulable',
      shortError: t('Multiple issues'),
      fullError: schedulingInfo.errors.map((e) => getErrorDisplays(e).full),
    };
  }

  return {
    getDisplayNameFromAppointment,
    getDisplayNameForPatient,
    getMemberAge,
    getDisplayBirthday,
    getDisplaySex,
    getDisplayAddressLines,
    getSchedulabilityDisplay,
    getErrorSchedulabilityDisplay,
  };
}

export type MemberHelpers = ReturnType<typeof useMemberHelpers>
