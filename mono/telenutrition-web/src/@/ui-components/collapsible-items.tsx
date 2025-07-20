import { Collapsible, CollapsibleContent, BasicCollapsibleTrigger } from './collapsible';
import { ReactNode } from 'react';

export interface CollapsibleItem {
  label: string;
  content: ReactNode;
  className?: string;
  disabled?: boolean;
  dataTestId?: string;
}

export default function CollapsibleItems({ items }: { items: CollapsibleItem[] }) {
  return (
    <div className="flex flex-col">
      {items.map((item) => (
        <Collapsible key={item.label}>
          <BasicCollapsibleTrigger
            disabled={item.disabled}
            className={item.className}
            label={item.label}
            dataTestId={item.dataTestId}
          />
          <CollapsibleContent className="pl-8 pt-2 pb-4">{item.content}</CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
