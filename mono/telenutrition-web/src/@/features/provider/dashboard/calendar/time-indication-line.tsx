import { RefObject, useEffect, useRef, useState } from 'react';
import { SlotTimingType } from './types';
import useUpdateStateOnInterval from 'hooks/useUpdateStateOnInterval';

const TimeIndicationLine = ({ positionY }: { positionY: number }) => {
  const style = { top: `${positionY}px` };

  return (
    <div className={'w-full absolute'} style={style}>
      <div className="h-[10px] w-[10px] rounded-full bg-purple-600 absolute -ml-[10px] -mt-[4px]" />
      <div className={'h-[2px] bg-purple-600'} style={style} />
    </div>
  );
};

export default TimeIndicationLine;

export function useTimeIndicationLine({
  slotTimingType,
  cellDuration,
}: {
  slotTimingType: SlotTimingType;
  cellDuration: number;
}):
  | { show: false; parentRef: RefObject<HTMLDivElement> }
  | { show: true; positionY: number; parentRef: RefObject<HTMLDivElement> } {
  useUpdateStateOnInterval(60 * 2 * 1000);
  const parentRef = useRef<HTMLDivElement>(null);
  const [positionY, setPositionY] = useState<null | number>(null);

  useEffect(() => {
    if (parentRef.current && slotTimingType.type === 'in-progress') {
      const totalNumSeconds = 60 * cellDuration;
      const newPosition =
        parentRef.current.clientHeight * (slotTimingType.currentSecond / totalNumSeconds);

      setPositionY(newPosition);
    } else {
      setPositionY(null);
    }
  }, [parentRef.current, slotTimingType]);

  if (positionY === null) {
    return { show: false, parentRef };
  }

  return { show: true, positionY, parentRef };
}
