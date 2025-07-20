import { cn } from '@/utils';
import { ReactNode } from 'react';

interface SectionProps {
  title?: string | ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  sectionClassName?: string;
  className?: string;
  divider?: boolean;
}

function Section({
  title,
  subtitle,
  className,
  children,
  sectionClassName,
  divider,
}: SectionProps) {
  return (
    <div
      className={cn('@container w-full py-4', divider && 'border-b border-b-border-color-light')}
    >
      <div className={cn('flex flex-col gap-y-4 @lg:gap-y-0 @lg:flex-row gap-x-9', className)}>
        {!!title && (
          <div className={cn('w-44 text-type-secondary flex-shrink-0')}>
            {title && <h4 className="text-lg text-neutral-600 font-semibold">{title}</h4>}
            {subtitle && subtitle}
          </div>
        )}
        <div className={cn('flex-1 flex flex-col gap-y-4', sectionClassName)}>{children}</div>
      </div>
    </div>
  );
}

// Adds max width
export function ContentBasicMaxWidth({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('max-w-[40rem]', className)}>{children}</div>;
}

export function SectionDivider() {
  return <div className="w-full h-[1px] bg-neutral-150 my-4" />;
}

Section.ContentBasicMaxWidth = ContentBasicMaxWidth;
Section.Divider = SectionDivider;

export default Section;
