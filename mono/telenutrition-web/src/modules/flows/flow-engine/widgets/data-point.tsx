import _ from 'lodash';
import type { DataPointDisplay } from '@mono/telenutrition/lib/types';
import parse from 'html-react-parser';
import dayjs from '../../../../utils/dayjs';
import { FlowValueBasic } from '../workflow-engine/types';
import { valueIsCompletedQuestion } from '../../scheduling/helpers';
import { useState } from 'react';
import Avocado from '../../../../../public/avocado.svg';


export default function DataPointWrapper(props: DataPointProps) {
  const { dataPoint } = props;

  const Component = DataPointContent(props);

  if (Component === null) return null;

  return (
    <div className="py-3 px-2 md:p-0">
      {dataPoint.label && <label className="text-lg font-medium">{dataPoint.label}</label>}
      {Component}
    </div>
  );
}

interface DataPointProps {
  dataPoint: DataPointDisplay;
  getFlowStateDisplayValue: (key: string | string[]) => FlowValueBasic | null;
}

function DataPointContent({
  dataPoint,
  getFlowStateDisplayValue,
}: DataPointProps): JSX.Element | null {
  function getCompletedQuestionFromKey(key: string): null | FlowValueBasic {
    const found = getFlowStateDisplayValue(key);
    if (!found) {
      console.log(`Cannot find: ${key}`);
      return null;
    }
    return found;
  }

  if (dataPoint.type === 'html') {
    return <p className="mt-1 text-lg font-light">{parse(dataPoint.html)}</p>;
  }

  if (dataPoint.type === 'value') {
    const { key } = dataPoint;
    const content = getCompletedQuestionFromKey(key);

    if (!content) return null;

    return <p className="mt-1 text-lg font-light">{content}</p>;
  }

  if (dataPoint.type === 'date') {
    const { key, format } = dataPoint;
    const content = getCompletedQuestionFromKey(key);

    if (!content) return null;

    if (_.isArray(content)) return null;

    const value = (valueIsCompletedQuestion(content) ? content.value : content) as string;

    return <p className="mt-1 text-lg font-light">{dayjs(value).format(format)}</p>;
  }

  if (dataPoint.type === 'image') {
    const { key, alt } = dataPoint;
    const src = getCompletedQuestionFromKey(key);

    const value = valueIsCompletedQuestion(src) ? src.value : src;

    const fallback =
      dataPoint.fallback.type === 'text'
        ? dataPoint.fallback.value
        : (getCompletedQuestionFromKey(dataPoint.fallback.key) as string);

    return <ImageDataPoint src={value as string | null} alt={alt} fallback={fallback} />;
  }

  if (dataPoint.type === 'text') {
    const { text } = dataPoint;
    const regex = /{{(\w.+)}}/g;

    const value = text.replace(regex, (value, key) => {
      const found = getCompletedQuestionFromKey(key);
      const v = (valueIsCompletedQuestion(found) ? found.value : found) as string;
      return (v as string) || key;
    });

    return <p className="mt-1 text-lg font-light">{value}</p>;
  }

  return null;
}

function ImageDataPoint({ src, alt, fallback }: { src: string | null; alt: string; fallback: string }) {
  const [isFallback, setIsFallback] = useState(false);

  if (isFallback || !src) {
    return (
      <div className="w-40 h-40 rounded-full border-f-dark-green border-2 border-solid flex justify-center items-center bg-f-light-green text-2xl text-white font-extrabold">
        {fallback}
      </div>
    );
  }

  if (src === '/avocado.svg') {
    return (
      <div className="w-40 h-40 rounded-full border-f-dark-green border-2 border-solid flex justify-center items-center overflow-hidden">
        <Avocado />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-40 h-40 rounded-full border-f-dark-green border-2 border-solid"
      onError={() => setIsFallback(true)}
    />
  );
}
