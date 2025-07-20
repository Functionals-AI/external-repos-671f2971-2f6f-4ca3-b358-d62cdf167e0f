import { ReactNode } from 'react';

import Card from '../card';
import DataCardPair from './data-card-pair';
import DataCardHeader from './data-card-header';

export interface DataPair {
  type: 'data';
  label: string;
  value: string | ReactNode;
  dataTestId?: string;
}

export interface DataHeader {
  type: 'header';
  label: string;
  dataTestId?: string;
}

export type DataValue = DataPair | DataHeader;

interface Props {
  data: DataValue[];
  dataTestId?: string;
}

export default function DataCard({ data, dataTestId }: Props) {
  const content = data.map((d) => {
    switch (d.type) {
      case 'data':
        return (
          <DataCardPair key={d.label} label={d.label} value={d.value} dataTestId={d.dataTestId} />
        );
      case 'header':
        return <DataCardHeader key={d.label} label={d.label} dataTestId={d.dataTestId} />;
    }
  });

  return (
    <Card dataTestId={dataTestId} className="mb-2">
      {content}
    </Card>
  );
}
