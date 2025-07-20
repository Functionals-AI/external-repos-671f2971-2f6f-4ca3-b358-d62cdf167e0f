import AsyncSelect from 'react-select/async';
import { ClearIndicatorProps, OptionProps } from 'react-select';
import useApiClient from 'api/client';
import {
  FetchProviderDepartmentPatientsParams,
  FetchProviderDepartmentPatientsResult,
} from 'api/provider/useFetchProviderDepartmentPatients';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { cn, debounce } from '@/utils';
import { inputClasses } from '@/ui-components/form/input';
import {
  HouseholdMemberSchedulable,
  HouseholdMemberWithSchedulingInfo,
  ProviderScheduleForPatientDisallowReason,
} from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { Button } from '@/ui-components/button';
import Icon from '@/ui-components/icons/Icon';
import { DateTime } from 'luxon';
import useFormConsts from 'hooks/useFormConsts';
import { DeveloperError } from 'utils/errors';
import { useRef } from 'react';

type OptionData =
  | {
      value: HouseholdMemberWithSchedulingInfo;
      isDisabled: false;
    }
  | {
      value: HouseholdMemberWithSchedulingInfo;
      isDisabled: true;
    };

function isAllowedOption(option: OptionData): option is AllowedOptionData {
  return option.value.schedulingInfo.canSchedule;
}

type AllowedOptionData = Omit<OptionData, 'value' | 'reason'> & {
  value: HouseholdMemberSchedulable;
};

type CanScheduleValidation =
  | {
      canSchedule: true;
    }
  | {
      canSchedule: false;
      reasons: ProviderScheduleForPatientDisallowReason[];
    };

export default function AsyncPatientSearchFormField({
  onChange,
  value,
  patientCanScheduleValidator,
  scheduleDate,
}: {
  value: HouseholdMemberSchedulable;
  onChange: (option: AllowedOptionData | null) => void;
  scheduleDate?: DateTime;
  patientCanScheduleValidator: (
    patient: HouseholdMemberWithSchedulingInfo,
  ) => CanScheduleValidation;
}) {
  const querySpy = useRef('');
  const api = useApiClient();
  const memberHelpers = useMemberHelpers();
  const formConsts = useFormConsts();

  const _loadOptions = (query: string, onComplete: (options: OptionData[]) => void) => {
    querySpy.current = query;
    const params: FetchProviderDepartmentPatientsParams = {
      query,
      ...(scheduleDate && scheduleDate.isValid ? { scheduleDate: scheduleDate.toISO()! } : {}),
    };
    api
      .get<FetchProviderDepartmentPatientsResult>('/provider/department-patients', { params })
      .then((res) => {
        if (res.meta.ok) {
          if (!res.data) return onComplete([]);
          const options = res.data.patients.map((patient) => {
            return {
              value: patient,
              isDisabled: !patientCanScheduleValidator(patient).canSchedule,
            };
          });
          onComplete(options);
        }
      });
  };

  const loadOptions = debounce(_loadOptions, 600);

  const getPatientOptionSublabel = (patient: PatientRecord): string => {
    const arr = [
      `ID: ${patient.patientId}`,
      `${patient.sex}${
        patient.birthday ? `/${DateTime.now().year - DateTime.fromISO(patient.birthday).year}` : ''
      }`,
      formConsts.states.find((state) => patient.state === state.value)?.label ?? null,
    ].filter((d) => !!d);

    return arr.join('  |  ');
  };

  return (
    <AsyncSelect
      isClearable
      onChange={(newVal?: OptionData) => {
        if (!newVal) {
          onChange(null);
          return;
        }
        if (!isAllowedOption(newVal)) throw new DeveloperError('This should be disallowed');
        onChange(newVal);
      }}
      value={value}
      cacheOptions
      loadOptions={loadOptions}
      components={{
        IndicatorSeparator: () => null,
        Input: (props) => (
          <input
            {...props}
            data-testid="patient-dropdown"
            className={cn(props.className, inputClasses, 'absolute text-base h-full ml-2')}
          />
        ),
        SingleValue: (option) => {
          return (
            <>
              {memberHelpers.getDisplayNameForPatient(option.data, { format: 'last, first' }).value}
            </>
          );
        },
        NoOptionsMessage: (q, a) => {
          const text = querySpy.current === '' ? 'Start typing to search...' : 'No results found';

          return <div className="flex items-center px-4 py-3 text-neutral-200">{text}</div>;
        },
        Placeholder: () => null,
        ClearIndicator: (props: ClearIndicatorProps) => {
          const {
            innerProps: { ref, ...restInnerProps },
          } = props;
          return (
            <div {...restInnerProps} ref={ref}>
              <Button variant="tertiary" className="px-2 mr-2">
                <Icon name="x" size="xs" />
              </Button>
            </div>
          );
        },
        Option: (props: OptionProps<any>) => {
          const patient = props.data?.value as HouseholdMemberWithSchedulingInfo;
          if (!patient) return <div />;

          const canScheduleValidation = patientCanScheduleValidator(patient);

          return (
            <div
              data-testid={`combobox-option-${patient.patientId}`}
              data-test={!canScheduleValidation.canSchedule ? 'disabled' : 'enabled'}
              aria-disabled={!canScheduleValidation.canSchedule}
              onClick={() => {
                if (!canScheduleValidation.canSchedule) return;
                props.selectOption(props.data);
              }}
              tabIndex={!canScheduleValidation.canSchedule ? -1 : undefined}
              className={cn(
                'cursor-pointer px-4 py-2',
                !canScheduleValidation.canSchedule &&
                  '!bg-neutral-115 !text-neutral-400 [&>p]:!text-neutral-400 !cursor-default hover:!bg-neutral-115',
                'hover:bg-status-green-100',
                props.isFocused && 'bg-status-green-100',
                props.isSelected && '!bg-green-600 !text-white [&>*]:!text-white',
              )}
            >
              <div className="flex justify-between">
                <p className={cn(props.isSelected && 'text-white')}>
                  {memberHelpers.getDisplayNameForPatient(patient, { format: 'last, first' }).value}
                </p>
                {!canScheduleValidation.canSchedule && (
                  <p className="flex items-center gap-x-2">
                    <Icon name="no" size="xs" color="neutral" />
                    {
                      memberHelpers.getErrorSchedulabilityDisplay({
                        canSchedule: false,
                        errors: canScheduleValidation.reasons,
                      }).shortError
                    }
                  </p>
                )}
              </div>
              <div>
                <p className={cn(props.isSelected && 'text-white')}>
                  {getPatientOptionSublabel(patient)}
                </p>
              </div>
            </div>
          );
        },
      }}
      classNames={{
        control: () =>
          '!border-0 focus:!border-0 focus:ring-0 !ring-0 focus:border-0 !border-transparent shadow-none focus:!shadow-none',
        valueContainer: () => 'p-4 min-h-[1.5rem]',
      }}
    />
  );
}
