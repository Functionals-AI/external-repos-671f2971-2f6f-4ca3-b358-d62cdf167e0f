import { SessionDuration } from 'types/globals';

export const MOCK_APPOINTMENT_TYPE_OPTIONS = [
  { value: 'Follow Up - 30 minutes', label: 'Follow Up - 30 minutes' },
  { value: 'Follow Up - 60 minutes', label: 'Follow Up - 60 minutes' },
];

export const MOCK_TIME_OPTIONS = [
  { value: SessionDuration.Thirty, label: '30 minutes' },
  { value: SessionDuration.Sixty, label: '60 minutes' },
];
