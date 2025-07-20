import React from 'react';
import { ReactNode } from 'react';

interface TimelineEntry {
  content: ReactNode;
  key: string;
}

interface TimelineVerticalProps {
  entries: TimelineEntry[];
}

export default function TimelineVertical({ entries }: TimelineVerticalProps) {
  return (
    <div>
      {entries.map((entry, index) => (
        <div key={entry.key} className="flex gap-x-2">
          <div className="px-3 flex flex-col items-center">
            {entries.length > 1 ? (
              <div className="w-[1px] h-3 bg-neutral-200" />
            ) : (
              <div className="h-3" />
            )}
            <div className="w-2 h-2 bg-[#D9D9D9] rounded-full" />
            {index !== entries.length - 1 && <div className="w-[1px] h-full bg-neutral-200" />}
          </div>
          <div className="flex flex-col gap-y-1 pt-2 pb-2">{entry.content}</div>
        </div>
      ))}
    </div>
  );
}
