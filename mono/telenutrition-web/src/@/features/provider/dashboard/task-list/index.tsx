import { AsBasicDate } from '@/modules/dates';
import { useModal } from '@/modules/modal';
import { Badge } from '@/ui-components/badge';
import { cn } from '@/utils';
import { DateTime } from 'luxon';
import { Trans, useTranslation } from 'react-i18next';
import IncompleteAppointmentModal from './incomplete-appointment-modal';
import { AppointmentIncompleteTask, ProviderCustomTask } from './types';
import CustomTaskModal from './custom-task-modal';
import Card from '@/ui-components/card';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useSidePanelContext } from '../side-panel/context';

export default function TaskList() {
  const { t } = useTranslation();
  const modal = useModal();
  const memberHelpers = useMemberHelpers();

  const { tasks } = useSidePanelContext();

  function handleOpenIncompleteAppointmentModal(task: AppointmentIncompleteTask) {
    modal.openPrimary({
      type: 'custom',
      modal: <IncompleteAppointmentModal task={task} />,
    });
  }

  /*function openAddTaskModal() {
    modal.openPrimary({
      type: 'add-task',
    });
  }*/

  function openCustomTaskModal(task: ProviderCustomTask) {
    modal.openPrimary({
      type: 'custom',
      modal: <CustomTaskModal task={task} />,
    });
  }

  return (
    <div
      className="top-20 flex flex-col gap-y-4 absolute bottom-0"
      data-testid="task-list-container"
    >
      {/* if this gets picked back up, it should be updated to new designs */}
      {/*<div className="flex justify-between sticky top-0 bg-white w-full py-4">
        <div className="flex items-center gap-x-2">
          <h3 className="text-lg">
            <Trans>Tasks</Trans>
          </h3>
          <Icon name="sliders" />
        </div>
        {featureFlags.hasFeature('provider_dashboard_0_9_improvements_DEV_16908') && (
          <Button
            dataTestId="open-add-task-modal"
            size="sm"
            variant="tertiary"
            onClick={openAddTaskModal}
          >
            <Icon color="fsGreen" size="xs" name="plus" /> <Trans>Add</Trans>
          </Button>
        )}
      </div>*/}
      <div className="flex flex-col w-full gap-y-2 overflow-y-auto h-full">
        {tasks.length === 0 && (
          <div>
            <Card className="py-4 px-2 flex items-center justify-center">
              <p className="font-semibold text-lg">
                <Trans>No tasks</Trans>
              </p>
            </Card>
          </div>
        )}
        {tasks.map((task) => {
          if (task.type === 'incomplete-appointment') {
            return (
              <TaskItem
                data-test={task.type}
                data-cy={task.subtype}
                key={task.appointment.appointmentId}
                level={task.level}
                title={task.title}
                subTitle={
                  task.appointment.patient
                    ? t('Member: {{patientName}}', {
                        patientName: memberHelpers.getDisplayNameForPatient(
                          task.appointment.patient,
                        ).value,
                      })
                    : `Member ID: ${task.appointment.patientId}`
                }
                dateTime={task.dateTime}
                onClick={() => handleOpenIncompleteAppointmentModal(task)}
              />
            );
          }

          if (task.type === 'custom-task') {
            return (
              <TaskItem
                data-test="custom-task"
                key={task.name}
                title={task.name}
                subTitle={task.note ?? ''}
                dateTime={task.dueDate}
                onClick={() => openCustomTaskModal(task)}
                level={
                  task.priority === 'low'
                    ? 'info'
                    : task.priority === 'medium'
                      ? 'warn'
                      : 'destructive'
                }
              />
            );
          }
        })}
      </div>
    </div>
  );
}

interface TaskItemProps {
  title: string;
  subTitle?: string;
  level: 'destructive' | 'warn' | 'info' | 'success';
  dateTime?: DateTime;
  onClick?: () => void;
}

function TaskItem({ title, subTitle, level, onClick, dateTime, ...props }: TaskItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex justify-between items-center',
        !!onClick && 'cursor-pointer hover:bg-neutral-100',
        'py-2 px-4 border-l-[6px]',
        level === 'destructive' && 'border-l-status-red-600',
        level === 'warn' && 'border-l-status-amber-150',
        level === 'info' && 'border-l-blue-150',
        level === 'success' && 'border-l-fs-pale-green-100',
      )}
      data-testid="task-list-item"
      {...props}
    >
      <div>
        <p className="text-base">{title}</p>
        {subTitle && <p className="text-sm text-neutral-400">{subTitle}</p>}
      </div>
      {dateTime && (
        <Badge
          className="h-6 whitespace-nowrap"
          leftIconName="calendar"
          variant={
            level === 'destructive'
              ? 'statusRed'
              : level === 'info'
                ? 'blue'
                : level === 'success'
                  ? 'statusGreen'
                  : level === 'warn'
                    ? 'statusAmber'
                    : 'neutral'
          }
        >
          <AsBasicDate format="short">{dateTime}</AsBasicDate>
        </Badge>
      )}
    </div>
  );
}
