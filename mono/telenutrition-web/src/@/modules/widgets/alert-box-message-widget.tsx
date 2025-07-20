import { UseFormReturn } from 'react-hook-form';
import type { AlertBoxMessageQuestion } from '@mono/telenutrition/lib/types';
import Card from '@/ui-components/card';
import { Checkbox } from '@/ui-components/checkbox';
import { FormControl, FormField, FormItem, FormLabel } from '@/ui-components/form/form';
import { cn } from '@/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/ui-components/collapsible';
import parse from 'html-react-parser';
import Icon from '@/ui-components/icons/Icon';

export default function AlertBoxMessageWidget({
  widget,
  form,
}: {
  form: UseFormReturn<any>;
  widget: AlertBoxMessageQuestion;
}) {
  return (
    <FormField
      name={widget.key}
      rules={widget.required ? { required: true } : {}}
      control={form.control}
      render={({ field }) => (
        <Card
          className={cn(
            'p-4',
            'border',
            widget.variant === 'warn'
              ? 'border-status-amber-200 bg-status-amber-100'
              : widget.variant === 'info'
                ? 'border-blue-400 bg-blue-100'
                : '',
          )}
        >
          <FormItem className="flex gap-x-2">
            <FormControl>
              <Checkbox {...field} className="mt-3" />
            </FormControl>
            <div className="flex flex-col gap-y-2">
              <FormLabel className="font-semibold text-base">{widget.title}</FormLabel>
              <Collapsible>
                <CollapsibleTrigger className="group focusable flex gap-x-1 items-center font-semibold text-sm text-neutral-600">
                  <Icon
                    name="chevron-right"
                    className={cn(
                      'rotate-0 group-data-[state="open"]:rotate-90 transition-transform',
                    )}
                  />
                  {widget.expanderLabel}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 ml-5">
                  <p className="font-normal text-neutral-1500">{parse(widget.expanderContent)}</p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </FormItem>
        </Card>
      )}
    />
  );
}
