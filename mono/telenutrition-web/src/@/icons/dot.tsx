import { cn } from '@/utils';

type DotSize = 'default' | 'lg';

const dotClassMap: Record<DotSize, string> = {
  default: 'h-2 w-2',
  lg: 'h-4 w-4',
};

export default function Dot({
  size = 'default',
  className,
}: {
  size?: DotSize;
  className?: string;
}) {
  const dotClass = dotClassMap[size];
  return <span className={cn('rounded-full bg-current', dotClass, className)} />;
}
