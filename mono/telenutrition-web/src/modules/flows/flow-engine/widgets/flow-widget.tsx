import { RegisterOptions } from 'react-hook-form';
import type { FlowWidget as TFlowWidget } from '@mono/telenutrition/lib/types';
import Select from '../../../../components/form/select';
import TextInput from '../../../../components/form/text-input';
import WorkflowWidget from './workflow-widget';
import { DeveloperError } from '../../../../utils/errors';
import React from 'react';
import DataDisplayWidget from './data-display-widget';
import parse from 'html-react-parser';
import ColumnsWidget from './columns-widget';
import TwoTieredListWidget from './two-tiered-list-widget';
import ButtonOptionsWidget from './button-options-widget';
import HeaderSubheaderWidget from './header-subheader-widget';
import HrWidget from './hr-widget';
import ConditionalSelectWidget from './conditional-select-widget';
import { FlowValueBasic } from '../workflow-engine/types';
import SingleCheckboxWidget from './single-checkbox-widget';
import CustomListSelectWidget from './custom-list-select-widget';
import HTMLWidget from './html-widget';
import DateInput from '../../../../components/form/text-input/date-input';

export type FlowWidgetProps<TWidget = TFlowWidget> = {
  widget: TWidget;
  getFlowStateValue: (key: string | string[]) => FlowValueBasic | null;
  getFlowStateDisplayValue: (key: string | string[]) => string | null;
};

export default function FlowWidget(props: FlowWidgetProps) {
  return (
    <div className="flex flex-col w-full">
      <RenderWidget {...props} />
    </div>
  );
}

const RenderWidget = (props: FlowWidgetProps) => {
  const { widget, getFlowStateDisplayValue, getFlowStateValue } = props;
  const registerOptions: RegisterOptions = {
    required: 'required' in widget && widget.required,
  };

  if (widget.type === 'header-subheader') {
    return <HeaderSubheaderWidget widget={widget} />;
  }

  if (widget.type === 'p') {
    return <p dangerouslySetInnerHTML={{ __html: `${parse(widget.text)}` }} />;
  }

  if (widget.type === 'text:date') {
    return (
      <DateInput questionKey={widget.key} name={widget.label} registerOptions={registerOptions} />
    );
  }

  if (
    widget.type === 'text' ||
    widget.type === 'text:email' ||
    widget.type === 'text:phone' ||
    widget.type === 'text:zipcode'
  ) {
    if (widget.max) {
      registerOptions.maxLength = {
        value: widget.max,
        message: `Field must be ${widget.max} characters or less.`,
      };
    }
    return (
      <TextInput
        questionKey={widget.key}
        name={widget.label}
        widget={widget.type}
        registerOptions={registerOptions}
      />
    );
  }

  if (widget.type === 'select') {
    const options = widget.options.map((option) => {
      return {
        id: typeof option.value !== 'string' ? String(option.value) : option.value,
        title: option.label,
        hidden: option.hidden
      };
    });
    return (
      <Select
        name={widget.label}
        questionKey={widget.key}
        label={widget.label}
        options={options}
        registerOptions={registerOptions}
      />
    );
  }

  if (widget.type === 'conditional-select') {
    return (
      <ConditionalSelectWidget
        widget={widget}
        registerOptions={registerOptions}
        getFlowStateValue={getFlowStateValue}
      />
    );
  }

  if (widget.type === 'columns') {
    return <ColumnsWidget {...{ ...props, widget }} />;
  }

  if (widget.type === 'workflow') {
    return <WorkflowWidget {...{ ...props, widget }} />;
  }

  if (widget.type === 'data-display') {
    return (
      <DataDisplayWidget widget={widget} getFlowStateDisplayValue={getFlowStateDisplayValue} />
    );
  }

  if (widget.type === 'two-tiered-list') {
    return <TwoTieredListWidget {...{ ...props, widget }} />;
  }

  if (widget.type === 'buttons-options') {
    return <ButtonOptionsWidget widget={widget} />;
  }

  if (widget.type === 'hr') {
    return <HrWidget widget={widget} />;
  }

  if (widget.type === 'single-checkbox') {
    return (
      <SingleCheckboxWidget
        widget={{ ...widget, label: parse(widget.label) as string }}
        getFlowStateValue={getFlowStateValue}
      />
    );
  }

  if (widget.type === 'custom-list-select') {
    return <CustomListSelectWidget {...{ ...props, widget }} />;
  }

  if (widget.type === 'html') {
    return <HTMLWidget {...{ widget }} />;
  }

  throw new DeveloperError(`Widget type is not supported: ${widget.type}`);
};
