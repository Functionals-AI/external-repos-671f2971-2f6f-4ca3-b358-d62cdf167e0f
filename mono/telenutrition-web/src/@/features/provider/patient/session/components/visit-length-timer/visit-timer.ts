export type TimerButtonAction = 'start' | 'stop';

export type SessionState = 'inactive' | 'running' | 'good' | 'over';

export interface TimerState {
  ticks: number;
  units: number;
  startTime: Date | null;
  endTime: Date | null;
  state: SessionState;
}

type Style = {
  bg: string;
  clock: string;
  svgFill: string;
  svgStroke: string;
};

export const styleMap: Record<SessionState, Style> = {
  inactive: {
    bg: 'border-neutral-200 text-neutral-200',
    clock: 'text-neutral-200',
    svgFill: 'fill-neutral-200',
    svgStroke: 'stroke-neutral-200',
  },
  running: {
    bg: 'bg-blue-100 border-blue-400 text-blue-600',
    clock: 'text-blue-400',
    svgFill: 'fill-blue-400 stroke-blue-400',
    svgStroke: 'fill-blue-400 stroke-blue-400',
  },
  good: {
    bg: 'bg-status-green-100 border-status-green-400 text-status-green-700',
    clock: 'text-status-green-400',
    svgFill: 'fill-status-green-400',
    svgStroke: 'stroke-status-green-400',
  },
  over: {
    bg: 'bg-status-amber-100 border-status-amber-150 text-status-amber-700',
    clock: 'text-status-amber-700',
    svgFill: 'fill-status-amber-700',
    svgStroke: 'stroke-status-amber-700',
  },
};

export function calculateUnits(time: number) {
  const minutes = time / 60;

  if (minutes < 8) {
    return 0;
  } else if (minutes < 23) {
    return 1;
  } else if (minutes < 38) {
    return 2;
  } else if (minutes < 53) {
    return 3;
  } else if (minutes < 68) {
    return 4;
  } else if (minutes < 83) {
    return 5;
  } else if (minutes < 98) {
    return 6;
  } else if (minutes < 113) {
    return 7;
  } else {
    return 8;
  }
}

export function countTicks(from: Date | null, to: Date | null) {
  if (from && to) {
    return Math.floor((to.getTime() - from.getTime()) / 1000);
  } else if (!from) {
    return 0;
  }

  return Math.floor((new Date().getTime() - from.getTime()) / 1000);
}

export function getStateFromEncounterData(
  startTime: Date | null,
  endTime: Date | null,
  sessionLengthMin: number,
  sessionTimeSec: number,
): SessionState {
  if (!startTime || endTime) {
    return 'inactive';
  }

  return getStateFromSessionLength(sessionLengthMin, sessionTimeSec);
}

export function getStateFromSessionLength(
  sessionLengthMin: number,
  sessionTimeSec: number,
): SessionState {
  const sessionIsOver = (sessionLengthMin - 2) * 60;
  const sessionIsGood = (sessionLengthMin - 7) * 60;

  if (sessionTimeSec >= sessionIsOver) {
    return 'over';
  } else if (sessionTimeSec >= sessionIsGood) {
    return 'good';
  }
  return 'running';
}
