import usePost from 'api/usePost';
import { AppointmentRecord } from '../types';

type Params = {
  payload: {
    startTimestamp: string;
    duration: number;
    fromFrozen?: boolean;
  };
};

export default function usePostProviderOverbookingSlots() {
  return usePost<Params, AppointmentRecord>({
    path: '/provider/overbooking/slots',
    invalidateCacheKeys: [['provider', 'appointments'], ['scheduling']],
  });
}
