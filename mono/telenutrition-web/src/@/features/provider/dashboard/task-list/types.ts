import { AppointmentRecord } from 'api/types';
import { DateTime } from 'luxon';

export type AppointmentIncompleteTask = {
  type: 'incomplete-appointment';
  subtype:
    | 'appointment-missed'
    | 'app-encounter-not-finalized'
    | 'historical-encounter-not-finalized'
    | 'physician-review-needs-attention';
  appointment: AppointmentRecord;
  dateTime: DateTime;
  level: 'destructive' | 'warn';
  title: string;
};

export type ProviderCustomTask = {
  type: 'custom-task';
  name: string;
  note?: string;
  dueDate?: DateTime;
  priority: string;
  status: string;
  taskId: number;
};

export type Task = AppointmentIncompleteTask | ProviderCustomTask;
