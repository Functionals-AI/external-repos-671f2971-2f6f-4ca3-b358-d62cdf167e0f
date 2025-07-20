import FlowWidget from './flow-widget';
import type { ColumnsWidget as IColumnsWidget } from '@mono/telenutrition/lib/types';
import { FlowValueBasic } from '../workflow-engine/types';

interface ColumnsWidgetProps {
  widget: IColumnsWidget;
  getFlowStateValue: (key: string | string[]) => FlowValueBasic | null;
  getFlowStateDisplayValue: (key: string | string[]) => string | null;
}

export default function ColumnsWidget({
  widget,
  getFlowStateValue,
  getFlowStateDisplayValue,
}: ColumnsWidgetProps) {
  return (
    <div className="flex-col md:flex-row flex gap-2 md:gap-4 w-full">
      {widget.widgets.map((col) => {
        const span = col.span ?? 1;

        return (
          <div
            key={`col-${'key' in col ? col.key : col.name}`}
            style={{ flex: span }}
            className="flex flex-col gap-y-4"
          >
            <FlowWidget
              widget={col}
              getFlowStateValue={getFlowStateValue}
              getFlowStateDisplayValue={getFlowStateDisplayValue}
            />
          </div>
        );
      })}
    </div>
  );
}
