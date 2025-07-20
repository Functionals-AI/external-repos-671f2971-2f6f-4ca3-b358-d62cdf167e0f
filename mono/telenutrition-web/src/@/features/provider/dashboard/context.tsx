import { DateTime } from 'luxon';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import localStorageHelpers from 'utils/localStorageHelpers';
import useFetchProviderOverbookingSlots, {
  FetchProviderOverbookingSlotsResult,
  OverbookingSlot,
} from 'api/provider/useFetchProviderOverbookingSlots';
import { UseFetchResponse } from 'hooks/useFetch';
import { useFetchProviderMe } from 'api/provider/useFetchProviderMe';

export enum ViewType {
  Week = 'week',
  SingleDay = 'single-day',
}

function isViewType(viewType: string): viewType is ViewType {
  return viewType === ViewType.SingleDay || viewType === ViewType.Week;
}

type ProviderDashboardContextType = {
  trackedDay: DateTime;
  setTrackedDay: (day: DateTime) => void;
  viewType: ViewType;
  setViewType: (viewType: ViewType) => void;
  providerOverbookingSlotsData: UseFetchResponse<FetchProviderOverbookingSlotsResult> | null;
  selectHighlightSlot: (slot: OverbookingSlot) => void;
  clearHighlightSlot: () => void;
  highlightSlot: OverbookingSlot | null;
  timezone: string;
};

const ProviderDashboardContext = createContext<ProviderDashboardContextType | null>(null);

export function ProviderDashboardContextProvider({
  timezone,
  children,
  defaultDate,
}: {
  timezone: string;
  children: ReactNode;
  defaultDate: DateTime | null;
}) {
  const { data } = useFetchProviderMe();
  const providerOverbookingSlotsData = useFetchProviderOverbookingSlots();
  const router = useRouter();
  const [trackedDay, _setTrackedDay] = useState(
    () =>
      defaultDate?.setZone(timezone).startOf('day') ??
      DateTime.now().setZone(timezone).startOf('day'),
  );
  const [highlightSlot, setHighlightSlot] = useState<OverbookingSlot | null>(null);

  const [viewType, _setViewType] = useState<ViewType>(() => {
    const savedViewType = localStorageHelpers.get('provider-dashboard-view-type-v2');
    if (savedViewType && isViewType(savedViewType)) {
      return savedViewType;
    }
    return ViewType.SingleDay;
  });

  function setTrackedDay(d: DateTime) {
    const url = new URL(window.location.href);
    url.searchParams.set('d', d.toISODate()!);
    router.push(url.toString());
    _setTrackedDay(d);
  }

  function setViewType(viewType: ViewType) {
    localStorageHelpers.set('provider-dashboard-view-type-v2', viewType);
    _setViewType(viewType);
  }

  const selectHighlightSlot = (slot: OverbookingSlot) => {
    setHighlightSlot(slot);
  };

  const clearHighlightSlot = () => {
    setHighlightSlot(null);
  };

  const value = {
    trackedDay,
    setTrackedDay,
    viewType,
    setViewType,
    providerOverbookingSlotsData: data?.features.canScheduleOverbookSlots
      ? providerOverbookingSlotsData
      : null,
    selectHighlightSlot,
    clearHighlightSlot,
    highlightSlot,
    timezone,
  };

  return (
    <ProviderDashboardContext.Provider value={value}>{children}</ProviderDashboardContext.Provider>
  );
}

export function useProviderDashboardContext() {
  const context = useContext(ProviderDashboardContext);
  if (!context) {
    throw new Error(
      'useProviderDashboardContext must be used within a ProviderDashboardContextProvider',
    );
  }
  return context;
}
