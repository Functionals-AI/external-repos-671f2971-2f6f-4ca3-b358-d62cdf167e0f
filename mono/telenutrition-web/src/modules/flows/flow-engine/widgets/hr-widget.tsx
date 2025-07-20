import type { HrWidget as IHrWidget } from '@mono/telenutrition/lib/types';

interface HrWidgetProps {
  widget: IHrWidget;
}

export default function HrWidget({ widget }: HrWidgetProps) {
  const { height, color } = widget;

  return <hr style={{ backgroundColor: color, width: '100%', height }} />;
}
