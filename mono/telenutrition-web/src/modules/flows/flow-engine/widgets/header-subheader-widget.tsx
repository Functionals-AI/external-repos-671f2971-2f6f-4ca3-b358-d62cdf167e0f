import HeaderSubheader from '../../../../components/header-subheader';
import type { HeaderSubheaderWidget as IHeaderSubheaderWidget } from '@mono/telenutrition/lib/types';

interface HeaderSubheaderWidgetProps {
  widget: IHeaderSubheaderWidget;
}

export default function HeaderSubheaderWidget({ widget }: HeaderSubheaderWidgetProps) {
  return (
    <HeaderSubheader
      header={widget.header}
      subheader={widget.subheader}
      headerSize={widget.headerSize}
    />
  );
}
