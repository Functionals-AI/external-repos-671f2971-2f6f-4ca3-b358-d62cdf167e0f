import _ from 'lodash';
import type { DataDisplayWidgetFlows as IDataDisplayWidget } from '@mono/telenutrition/lib/types';
import DataPoint from './data-point';
import { FlowValueBasic } from '../workflow-engine/types';

interface DataDisplayWidgetProps {
  widget: IDataDisplayWidget;
  getFlowStateDisplayValue: (key: string | string[]) => FlowValueBasic | null;
}

export default function DataDisplayWidget({
  widget: { blocks },
  getFlowStateDisplayValue,
}: DataDisplayWidgetProps) {
  return (
    <div>
      {blocks.map((block) => {
        const { title, dataPoints, name, cols } = block;
        return (
          <div className="px-4 sm:px-6 text-center md:text-left" key={name}>
            {title && (
              <div className="py-6">
                <h3 className="font-bold text-f-very-dark-green">{title}</h3>
              </div>
            )}
            <div className={`flex flex-col md:grid md:grid-cols-${cols} md:gap-x-2 md:gap-y-6`}>
              {dataPoints
                .map((dataPoint) => {
                  const key = `dp-${'key' in dataPoint ? dataPoint.key : dataPoint.name}-${
                    dataPoint.label
                  }`;
                  return (
                    <DataPoint
                      dataPoint={dataPoint}
                      key={key}
                      getFlowStateDisplayValue={getFlowStateDisplayValue}
                    />
                  );
                })
                .filter((c) => !!c)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
