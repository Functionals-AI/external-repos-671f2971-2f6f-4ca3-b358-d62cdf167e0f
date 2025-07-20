interface CalendarIconProps {
  month: string;
  day: string;
  dayOfWeek: string;
}

export default function CalendarIcon({ month, day, dayOfWeek }: CalendarIconProps) {
  return (
    <div className="min-w-32 min-h-48 p-3 mb-4 font-medium">
      <div className="w-32 flex-none rounded-t lg:rounded-t-none lg:rounded-l text-center border border-neutral-150 ">
        <div className="block rounded-t overflow-hidden  text-center ">
          <div className="bg-f-dark-green text-white py-1">{month}</div>
          <div className="pt-1 border-l border-r border-white bg-white">
            <span className="text-5xl font-bold leading-tight">{day}</span>
          </div>
          <div className="pb-2 border-l border-r border-b rounded-b-lg text-center border-white bg-white -pt-2 -mb-1">
            <span className="text-sm">{dayOfWeek}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
