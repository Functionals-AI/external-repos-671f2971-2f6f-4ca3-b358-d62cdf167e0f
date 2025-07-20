import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { AppointmentRecord } from 'api/types';
import { cn } from '@/utils';
import Icon from '@/ui-components/icons/Icon';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui-components/popover';
import { DateTime } from 'luxon';
import StickyNoteBar from '@/smart-components/sticky-note-bar';
import { Button, ButtonProps } from '@/ui-components/button';
import OverflowMenu, { OverflowMenuItem } from '@/ui-components/dropdown-menu/overflow-menu';
import { CellSize, CalendarHourItemCellContent } from '../../calendar-item-hour-cell';
import { SlotTimingType } from '../../types';
import { DeveloperError } from 'utils/errors';
import {
  AppointmentComputedStatus,
  getAppointmentComputedStatus,
} from '@/selectors/appointmentComputedStatus';
import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useDrawer } from '@/modules/drawer';
import { useModal } from '@/modules/modal';
import { useFeatureFlags } from '@/modules/feature-flag';
import { TimezoneContext } from '@/modules/dates/context';
import { Badge } from '@/ui-components/badge';
import BannerBar from '@/modules/banner/banner';

type ScheduleOverflowMenuItemOption =
  | 'go-to-visit'
  | 'view-chart'
  | 'member-quick-view'
  | 'member-management'
  | 'edit-member'
  | 'reschedule-visit'
  | 'cancel-visit'
  | 'separator';

type CalendarItemOptions = {
  colors: null | { border: string };
  ctaButtons: {
    left?: ButtonProps[];
    right?: ButtonProps[];
  };
  overflowMenuItems: OverflowMenuItem[];
};

export function useScheduledCalendarItemState({ appointment }: { appointment: AppointmentRecord }) {
  const router = useRouter();
  const { t } = useTranslation();
  const drawer = useDrawer();
  const modal = useModal();
  const featureFlags = useFeatureFlags();

  function goToSessionDetails() {
    router.push(`/schedule/provider/session/${appointment.appointmentId}/details`);
  }

  function getOverflowMenuItems(options: ScheduleOverflowMenuItemOption[]): OverflowMenuItem[] {
    return options
      .map((type) => {
        if (type === 'view-chart') {
          return {
            label: t('Open session details'),
            onClick: () => goToSessionDetails(),
          };
        }
        if (type === 'separator') {
          return 'separator' as const;
        }
        if (type === 'member-management') {
          return { label: t('Member management'), onClick: () => goToMemberManagementPage() };
        }
        if (type === 'edit-member') {
          return { label: t('Edit member'), onClick: () => goToEditMemberPage() };
        }
        if (type === 'cancel-visit') {
          return { label: t('Cancel session'), onClick: openCancelSessionModal };
        }
        if (type === 'go-to-visit') {
          return { label: t('Open session'), onClick: goToSession };
        }
        if (type === 'member-quick-view') {
          return { label: t('Member quick view'), onClick: openPatientDetailsDrawer };
        }
        if (type === 'reschedule-visit') {
          return { label: t('Reschedule session'), onClick: openRescheduleSessionModal };
        }
        return null;
      })
      .filter(Boolean) as OverflowMenuItem[];
  }

  const appointmentComputedStatus = getAppointmentComputedStatus(appointment);

  const options: Record<AppointmentComputedStatus, CalendarItemOptions> = {
    'provider-response-required': {
      colors: {
        border: 'status-amber-150',
      },
      ctaButtons: {
        right: [
          {
            children: t('Update chart'),
            onClick: () => {
              goToSession();
            },
            variant: 'secondary',
          },
        ],
      },
      overflowMenuItems: getOverflowMenuItems([
        'go-to-visit',
        'member-quick-view',
        'separator',
        'member-management',
        'edit-member',
      ]),
    },
    oversight: {
      ctaButtons: {
        right: [
          {
            children: t('View chart'),
            variant: 'secondary',
            onClick: () => {
              goToSessionDetails();
            },
          },
        ],
      },
      colors: {
        border: 'blue-400',
      },
      overflowMenuItems: getOverflowMenuItems([
        'view-chart',
        'member-quick-view',
        'separator',
        'member-management',
        'edit-member',
      ]),
    },
    complete: {
      colors: {
        border: 'neutral-200',
      },
      ctaButtons: {
        right: [
          {
            children: t('View chart'),
            onClick: () => {
              goToSession();
            },
            variant: 'primary',
          },
        ],
      },
      overflowMenuItems: getOverflowMenuItems([
        'view-chart',
        'member-quick-view',
        'separator',
        'member-management',
        'edit-member',
      ]),
    },
    canceled: {
      colors: null,
      ctaButtons: {
        right: [],
      },
      overflowMenuItems: [],
    },
    current: {
      colors: {
        border: 'fs-green-300',
      },
      ctaButtons: {
        left: [
          {
            children: t('Cancel visit'),
            leftIcon: { name: 'calendar', color: 'neutral' },
            onClick: () => openCancelSessionModal(),
            variant: 'tertiary',
            className: 'text-neutral-600',
          },
        ],
        right: [
          {
            children: t('Reschedule'),
            onClick: () => {
              openRescheduleSessionModal();
            },
            variant: 'secondary',
          },
          {
            children: t('Go to visit'),
            onClick: () => {
              goToSession();
            },
            variant: 'primary',
          },
        ],
      },
      overflowMenuItems: getOverflowMenuItems([
        'go-to-visit',
        'member-quick-view',
        'separator',
        'member-management',
        'edit-member',
        'separator',
        'reschedule-visit',
        'cancel-visit',
      ]),
    },
    'needs-attention': {
      colors: {
        border: 'status-red-400',
      },
      ctaButtons: {
        left: [
          {
            children: t('Cancel visit'),
            leftIcon: { name: 'calendar', color: 'neutral' },
            onClick: () => openCancelSessionModal(),
            variant: 'tertiary',
            className: 'text-neutral-600',
          },
        ],
        right: [
          {
            children: t('Reschedule'),
            onClick: () => {
              openRescheduleSessionModal();
            },
            variant: 'secondary',
          },
          {
            children: t('Go to visit'),
            onClick: () => {
              goToSession();
            },
            variant: 'secondary',
          },
        ],
      },
      overflowMenuItems: getOverflowMenuItems([
        'go-to-visit',
        'member-quick-view',
        'separator',
        'member-management',
        'edit-member',
        'separator',
        'reschedule-visit',
        'cancel-visit',
      ]),
    },
    upcoming: {
      colors: {
        border: 'blue-400',
      },
      ctaButtons: {
        left: [
          {
            children: t('Cancel visit'),
            leftIcon: { name: 'calendar', color: 'neutral' },
            onClick: () => openCancelSessionModal(),
            variant: 'tertiary',
            className: 'text-neutral-600',
          },
        ],
        right: [
          {
            children: t('Reschedule'),
            onClick: () => {
              openRescheduleSessionModal();
            },
            variant: 'secondary',
          },
          {
            children: t('Go to visit'),
            onClick: () => {
              goToSession();
            },
            variant: 'secondary',
          },
        ],
      },
      overflowMenuItems: getOverflowMenuItems([
        'go-to-visit',
        'member-quick-view',
        'separator',
        'member-management',
        'edit-member',
        'separator',
        'reschedule-visit',
        'cancel-visit',
      ]),
    },
    incomplete: {
      colors: {
        border: 'status-amber-150',
      },
      ctaButtons: {
        left: [
          {
            children: t('Cancel visit'),
            leftIcon: { name: 'calendar', color: 'neutral' },
            onClick: () => openCancelSessionModal(),
            variant: 'tertiary',
            className: 'text-neutral-600',
          },
        ],
        right: [
          {
            children: t('Reschedule'),
            onClick: () => {
              openRescheduleSessionModal();
            },
            variant: 'secondary',
          },
          {
            children: t('Go to visit'),
            onClick: () => {
              goToSession();
            },
            variant: 'secondary',
          },
        ],
      },
      overflowMenuItems: getOverflowMenuItems([
        'go-to-visit',
        'member-quick-view',
        'separator',
        'member-management',
        'edit-member',
        'separator',
        'reschedule-visit',
        'cancel-visit',
      ]),
    },
  };

  const overflowMenuItems: OverflowMenuItem[] = (() => {
    if (appointmentComputedStatus === 'canceled') {
      return [];
    }
    if (appointmentComputedStatus === 'complete') {
      return [
        {
          label: t('Open session details'),
          onClick: () => goToSessionDetails(),
        },
        'separator' as const,
        { label: t('Member management'), onClick: () => goToMemberManagementPage() },
        { label: t('Edit member'), onClick: () => goToEditMemberPage() },
      ];
    }
    return [
      { label: t('Open session...'), onClick: goToSession },
      'separator' as const,
      { label: t('Member management'), onClick: () => goToMemberManagementPage() },
      { label: t('Edit member'), onClick: () => goToEditMemberPage() },
      ...(appointment.patient
        ? [
            'separator' as const,
            {
              label: t('Reschedule session...'),
              onClick: () => openRescheduleSessionModal(),
            },
            {
              label: t('Cancel session...'),
              onClick: () => openCancelSessionModal(),
            },
          ]
        : []),
    ];
  })();

  function openPatientDetailsDrawer() {
    if (!appointment.patientId)
      throw new DeveloperError('Patient ID should be defined for scheduled calendar item');
    drawer.openDrawer({ type: 'patient-quick-view', patientId: appointment.patientId });
  }

  function goToSession() {
    router.push(`/schedule/provider/session/${appointment.appointmentId}/meeting`);
  }

  function openRescheduleSessionModal() {
    if (featureFlags.hasFeature('thorough_scheduling_flow_ENG_1629')) {
      modal.openPrimary({
        type: 'reschedule-session-v2',
        rescheduleAppointment: appointment,
      });
    } else {
      modal.openPrimary({ type: 'reschedule-session', rescheduleAppointment: appointment });
    }
  }

  function openCancelSessionModal() {
    modal.openPrimary({ type: 'cancel-session', appointment });
  }

  function goToMemberManagementPage() {
    router.push(`/schedule/provider/patient/${appointment.patientId}/profile/view`);
  }
  function goToEditMemberPage() {
    router.push(`/schedule/provider/patient/${appointment.patientId}/profile/edit`);
  }

  if (!appointmentComputedStatus) {
    throw new DeveloperError('Appointment computed status is not defined');
  }

  return {
    overflowMenuItems,
    options: options[appointmentComputedStatus],
    appointmentComputedStatus,
  };
}

interface ScheduledCellProps {
  appointment: AppointmentRecord;
  showAudioVideoIcon?: boolean;
  cellSize: CellSize;
  slotTimingType: SlotTimingType;
}

export default function ScheduledCell({
  appointment,
  showAudioVideoIcon = false,
  cellSize,
  slotTimingType,
}: ScheduledCellProps) {
  const timezone = useContext(TimezoneContext)?.timezone ?? 'America/New_York';
  const memberHelpers = useMemberHelpers();
  const { t } = useTranslation();
  const {
    options: { colors, ctaButtons, overflowMenuItems },
    appointmentComputedStatus,
  } = useScheduledCalendarItemState({
    appointment,
  });

  const isToday =
    DateTime.fromISO(appointment.startTimestamp).setZone(timezone).toFormat('LL/dd/yyyy') ===
    DateTime.now().setZone(timezone).toFormat('LL/dd/yyyy');

  const AudioOrVideoIcon = appointment.isAudioOnly ? (
    <Icon size="sm" name="video-off" color="neutral" />
  ) : (
    <Icon size="sm" name="video" color="blue" />
  );

  const bgClassName = (() => {
    if (!isToday) return '';

    if (appointmentComputedStatus === 'needs-attention') return 'bg-status-red-100';
    if (appointmentComputedStatus === 'complete') return 'bg-white';
    if (appointmentComputedStatus === 'canceled') return 'bg-status-red-100';
    if (appointmentComputedStatus === 'current') return 'bg-status-green-100';
    if (appointmentComputedStatus === 'incomplete') return 'bg-status-amber-100';
    if (appointmentComputedStatus === 'upcoming') return 'bg-blue-100';
    return '';
  })();

  function getAppointmentDateRangeString(timezone: string) {
    return `${DateTime.fromISO(appointment.startTimestamp).setZone(timezone).toFormat('h:mm a')} - ${DateTime.fromISO(
      appointment.startAt,
    )
      .setZone(timezone)
      .plus({ minutes: appointment.duration })
      .toFormat('h:mm a')}`;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <CalendarHourItemCellContent
          dataCy={
            appointmentComputedStatus === 'needs-attention'
              ? 'appointment-needs-attention'
              : undefined
          }
          dataTestId={appointment.duration === 60 ? 'booked-hour' : 'booked-30min'}
          className={cn('group', 'bg-white', 'cursor-pointer', bgClassName)}
          style={colors?.border ? { borderLeftColor: `var(--${colors.border})` } : {}}
          slotTimingType={slotTimingType}
        >
          <div
            className={cn(
              'inline-flex flex-col gap-y-2 [&>div>svg]:fill-blue-400',
              appointmentComputedStatus === 'needs-attention' &&
                'text-status-red-800 [&>div>svg]:fill-status-red-800]',
            )}
          >
            <div className="flex gap-x-3 items-start z-10">
              {showAudioVideoIcon && <div className="mt-2">{AudioOrVideoIcon}</div>}
              <div>
                <h4 className={cn('text-current text-base', cellSize === 'sm' && 'text-sm')}>
                  {memberHelpers.getDisplayNameFromAppointment({ appointment })}
                </h4>
                <p className={cn('text-neutral-600 text-sm', cellSize === 'sm' && 'text-sm')}>
                  {appointment.patientId}
                </p>
              </div>
            </div>
          </div>
        </CalendarHourItemCellContent>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-[557px] -mt-40 border-l-8 p-4')}
        style={colors?.border ? { borderLeftColor: `var(--${colors.border})` } : {}}
      >
        {appointment.patient && (
          <div>
            <span className="inline-flex gap-x-3 items-center">
              <h4 className="font-semibold text-xl">
                {memberHelpers.getDisplayNameForPatient(appointment.patient).value}
              </h4>
              <p className="text-neutral-600 text-sm">
                {memberHelpers.getMemberAge(appointment.patient)} {appointment.patient.sex}
              </p>
            </span>
            <p className="text-sm text-neutral-600">ID: {appointment.patient.patientId}</p>
          </div>
        )}
        <div className="mt-2">
          <span className="flex flex-row gap-x-2 !text-neutral-600 items-center">
            {AudioOrVideoIcon}
            {DateTime.fromISO(appointment.startTimestamp).toFormat('LLL dd, yyyy')}
            <div className="w-1 bg-neutral-150 h-full" />
            {getAppointmentDateRangeString(timezone)}
            {appointment.patient?.timezone && appointment.patient.timezone !== timezone && (
              <Badge className="w-fit" leftIconName="clock" variant="statusAmber">
                {`${getAppointmentDateRangeString(appointment.patient?.timezone)} ${t('Member time')}`}
              </Badge>
            )}
          </span>
        </div>
        <div className="mt-4">
          {appointment.patient && (
            <StickyNoteBar patientId={appointment.patient.patientId} className="shadow-sm" />
          )}
        </div>
        {appointmentComputedStatus === 'provider-response-required' && (
          <BannerBar
            dataTestId="banner-appointment-provider-response-required"
            className="mt-4"
            banner={{
              type: 'warn',
              size: 'large',
              message: t('Provider response required'),
              description: appointment.encounter?.oversightComment ?? undefined,
            }}
          />
        )}
        {appointmentComputedStatus === 'oversight' && (
          <BannerBar
            dataTestId="banner-appointment-oversight"
            bannerIconName="lock"
            className="mt-4"
            banner={{
              type: 'info',
              size: 'large',
              message: t('Pending physician review'),
              description: t(
                'You may view the chart, but no edits may be made until review has been completed',
              ),
            }}
          />
        )}
        <div className="flex justify-between mt-4">
          <div className="flex flex-row gap-x-2">
            {ctaButtons.left?.map((buttonProps) => (
              <Button key={String(buttonProps.children)} {...buttonProps} />
            ))}
          </div>
          <div className="flex flex-row gap-x-2">
            {ctaButtons.right?.map((buttonProps) => (
              <Button key={String(buttonProps.children)} {...buttonProps} />
            ))}
            <OverflowMenu items={overflowMenuItems} type="visible" buttonVariant="tertiary" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
