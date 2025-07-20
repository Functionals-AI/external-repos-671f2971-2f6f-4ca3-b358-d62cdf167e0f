import { cn } from '@/utils';
import { ElementRef, ForwardRefExoticComponent, ReactNode, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormV2Context } from './form';

export function FormItemLabel({
  label,
  id,
  required,
  className,
  hideOptionalText,
}: {
  label?: ReactNode;
  hideOptionalText?: boolean;
  id: string;
  required?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const { config } = useFormV2Context();

  if (!label) return null;

  const hideOptionalTextStr = !config.showOptionalLabel || hideOptionalText;

  const optionalText = hideOptionalTextStr ? '' : `(${t('optional')})`;

  return (
    <div className={cn('h-4 flex items-center text-current', className)}>
      <label htmlFor={id} className="text-sm">
        {label} {required ? <span className="text-status-red-600">*</span> : optionalText}
      </label>
    </div>
  );
}

export function FormItemLabelV2({
  label,
  required,
  hideOptionalText,
  children,
}: {
  label?: ReactNode;
  required?: boolean;
  hideOptionalText?: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const { config } = useFormV2Context();
  const hideOptionalTextStr = !config.showOptionalLabel || hideOptionalText;
  const optionalText = hideOptionalTextStr ? '' : `(${t('optional')})`;
  return (
    <label className={'w-full'}>
      {label && (
        <span className={cn('h-4 flex items-center text-sm text-current')}>
          {label}{' '}
          {required ? <span className="ml-[2px] text-status-red-600">*</span> : optionalText}
        </span>
      )}
      {children}
    </label>
  );
}

export interface FormItemBoxUiProps {
  className?: string;
  children: ReactNode;
  as?: 'div' | 'button';
  isError?: boolean;
  isDisabled?: boolean;
}

const FormItemBoxUi = forwardRef<
  ElementRef<ForwardRefExoticComponent<'div' | 'button'>>,
  FormItemBoxUiProps
>(function ({ children, isError, className, as = 'div', isDisabled, ...props }, ref) {
  const Component = as;

  return (
    <Component
      ref={ref}
      {...(Component === 'button' ? { type: 'button' } : {})}
      className={cn(
        'transition-colors',
        'border rounded-md p-2 flex flex-col focusable',
        isError
          ? 'border-status-red-600 ring-status-red-600 focusable-error'
          : 'border-neutral-200',
        isDisabled && 'bg-neutral-115 border-neutral-115 text-neutral-400',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

FormItemBoxUi.displayName = 'FormItemBoxUi';

export { FormItemBoxUi };

export function FormItemDescription({ description }: { description?: ReactNode }) {
  if (!description) return null;
  return (
    <div className="px-2">
      <p>{description}</p>
    </div>
  );
}
