import { useTranslation } from 'react-i18next';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { cn } from '@/utils';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

interface PatientDisplayProps {
  patient: PatientRecord & { isSelf: boolean };
  onClick?: (patientId: number) => void;
  as: 'button' | 'div';
}

export default function PatientDisplay({ patient, onClick, as }: PatientDisplayProps) {
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();

  const Component = as;

  const maleStr = t('Male', 'Male');
  const femaleStr = t('Female', 'Female');

  return (
    <Component
      className={cn(
        'flex shadow-sm hover:shadow-md rounded-md py-8 px-6 w-full bg-white items-center border border-neutral-150 transition-all',
        as === 'button' && 'focusable',
      )}
      key={patient.patientId}
      onClick={() => onClick?.(patient.patientId)}
    >
      <div className="flex flex-col text-left">
        <h3 className="text-lg">{memberHelpers.getDisplayNameForPatient(patient).value}</h3>
        <p className="text-base">
          {t('BirthdayAndValue', 'Birthday: {{birthday}}', { birthday: patient.birthday ?? '-' })}
        </p>
        <p className="text-base">
          {t('SexAndValue', 'Sex: {{sex}}', {
            sex: patient.sex === 'M' ? maleStr : femaleStr,
          })}
        </p>
        <p className="text-base">
          {t('StateAndValue', 'State: {{state}}', { state: patient.state })}
        </p>
        {patient.timezone && (
          <p className="text-base">
            {t('TimezoneAndValue', 'Timezone: {{timezone}}', { timezone: patient.timezone })}
          </p>
        )}
        {/* {!!patient.email && (
          <p className="text-base">
            {t('EmailAndValue', 'Email: {{email}}', { email: patient.email })}
          </p>
        )} */}
      </div>
    </Component>
  );
}
