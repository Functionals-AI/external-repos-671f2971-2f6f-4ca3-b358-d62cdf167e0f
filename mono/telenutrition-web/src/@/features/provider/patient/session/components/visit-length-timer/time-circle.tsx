import SvgCircle from '@/icons/svg-circle';
import { styleMap, TimerState } from './visit-timer';
import { DateTime } from 'luxon';

interface TimeCircleProps {
  timestamp: Date | null;
  state: TimerState;
}

export function TimeCircle({ timestamp, state }: TimeCircleProps) {
  let display = '-';
  let svgClasses = `fill-none ${styleMap[state.state].svgStroke}`;

  if (timestamp) {
    display = DateTime.fromJSDate(timestamp).toFormat('hh:mma ZZZZ');
    svgClasses = `${styleMap[state.state].svgStroke} ${styleMap[state.state].svgFill}`;
  }

  return (
    <div className="relative">
      <SvgCircle className={svgClasses} size={10} strokeWidth={1.5} />
      <div className="absolute top-0 whitespace-nowrap ml-4 -mt-2">{display}</div>
    </div>
  );
}
