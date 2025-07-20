import type { WidgetSize } from '@mono/telenutrition/lib/types';
import parse from 'html-react-parser';

interface WidgetLabelProps {
  label?: string;
  sublabel?: string;
  required?: boolean;
}

export default function WidgetLabel({ label, sublabel, required }: WidgetLabelProps) {
  if (!label) return null;
  return (
    <div className="flex flex-col gap-y-1">
      <p className="text-neutral-1500 font-medium text-base">
        {label} {required && <span className="ml-2 text-status-red-800">*</span>}
      </p>
      {sublabel && (
        <p
          className="text-sm text-neutral-700"
          dangerouslySetInnerHTML={{ __html: `${parse(sublabel)}` }}
        />
      )}
    </div>
  );
}

export function WidgetDescription({ description }: { description?: string }) {
  if (!description) return null;
  return <p className="text-sm text-neutral-600">{description}</p>;
}

export function getSizeClassName(size: WidgetSize | null, defaultSize?: WidgetSize): string {
  const sizeToCheck = size ?? defaultSize;

  if (!sizeToCheck) return '';

  if (sizeToCheck === 'full') return 'w-full';
  if (sizeToCheck === 'xl') return 'w-full max-w-[37.5rem]';
  if (sizeToCheck === 'lg') return 'w-full max-w-[27.5rem]';
  if (sizeToCheck === 'md') return 'w-full max-w-[14rem]';
  if (sizeToCheck === 'sm') return 'w-full max-w-[6.5rem]';

  return '';
}
