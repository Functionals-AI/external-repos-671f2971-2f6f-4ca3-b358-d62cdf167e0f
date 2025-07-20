import type { HTMLWidgetFlows as THTMLWidget } from '@mono/telenutrition/lib/types';

interface HTMLWidgetProps {
  widget: THTMLWidget;
}

export default function HTMLWidget({ widget }: HTMLWidgetProps) {
  return <div dangerouslySetInnerHTML={{ __html: widget.html }} />;
}
