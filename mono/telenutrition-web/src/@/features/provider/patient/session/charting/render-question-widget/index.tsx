import TextArea from '@/ui-components/text-area';
import FormTableWidget from '@/modules/widgets/form-table-widget';
import SelectFormItem from '@/modules/form/select-item';
import { DeveloperError } from 'utils/errors';
import RadioGroupTiered from '@/modules/form/radio-group-tiered';
import CheckboxList from '@/modules/form/checkbox-list';
import FormNumberInput from '@/modules/form/form-number-input';
import FormTextInput from '@/modules/form/form-text-input';
import FormTagInputItem from '@/modules/form/form-tag-input-item';
import { UseFormReturn } from 'react-hook-form';
import AlertBoxMessageWidget from '@/modules/widgets/alert-box-message-widget';
import FormTimeInput from '@/modules/form/form-time-input';
import EntryEditorWidget from '@/modules/widgets/entry-editor-widget';
import FormRichTextEditor from '@/modules/form/form-rich-text-editor';
import FormPhoneInput from '@/modules/form/form-phone-input';
import CheckBox from '@/ui-components/radio-and-checkbox/checkbox';
import FormTagInputItemV2 from '@/modules/form/form-tag-input-item-v2';
import FormConditionalTagInput from '@/modules/form/form-conditional-tag-input';
import RadioGroupV2 from '@/modules/form/radio-group-v2';
import QuestionsWithDateWidget from '@/features/provider/patient/session/charting/questions-with-date-widget';
import FormComboBoxItem from '@/modules/form/form-combo-box';
import { cn } from '@/utils';
import WidgetLabel, { getSizeClassName, WidgetDescription } from '@/modules/widgets/widget-label';
import RadioTableItem from '@/modules/form/radio-table-item';
import FormDatePickerItem from '@/modules/form/form-date-picker-item';
import { QuestionWidget } from '@mono/telenutrition/lib/types';
import PreviousAnswerPrompt from './previous-answer-prompt';
import { useFeatureFlags } from '@/modules/feature-flag';

interface RenderQuestionWidgetWrapperProps {
  widget: QuestionWidget;
  form: UseFormReturn<any>;
}

export default function RenderQuestionWidgetWrapper({
  widget,
  form,
}: RenderQuestionWidgetWrapperProps) {
  const featureFlags = useFeatureFlags();

  return (
    <div
      className={cn(
        'flex flex-col gap-y-2',
        'border-b border-b-neutral-150 last:border-b-transparent pb-6 last:pb-0',
        widget.hideBottomBorder && 'border-b-0 pb-0',
      )}
      id={`widget-question-${widget.key}`}
      data-testid={`widget-question-${widget.key}`}
      data-cy={widget.required ? 'required' : 'optional'}
    >
      <WidgetLabel
        required={'required' in widget ? widget.required : undefined}
        label={widget.label}
        sublabel={widget.sublabel}
      />
      {!!widget.prevAnswerPrompt && widget.prevAnswerPromptLocation !== 'parent' && (
        <PreviousAnswerPrompt widget={widget} form={form} />
      )}
      <div className={cn(getSizeClassName(widget.size ?? null, 'xl'))}>
        <RenderQuestionWidget widget={widget} form={form} />
      </div>
      <WidgetDescription description={widget.description} />
    </div>
  );
}

type RenderQuestionWidgetProps = {
  widget: QuestionWidget;
  form: UseFormReturn<any>;
};

function RenderQuestionWidget({ widget, form }: RenderQuestionWidgetProps) {
  const requiredRule = widget.required ? { required: true } : {};

  if (widget.type === 'radio-table') {
    return (
      <RadioTableItem
        form={form}
        columns={widget.columns}
        rows={widget.rows}
        id={widget.key}
        disabled={widget.disabled}
        required={widget.required}
      />
    );
  }

  if (widget.type === 'input:select') {
    return (
      <SelectFormItem
        dataTestId={`${widget.key}-input`}
        form={form}
        id={widget.key}
        label={widget.inputLabel}
        rules={requiredRule}
        options={widget.options}
        disabled={widget.disabled}
      />
    );
  }

  if (widget.type === 'input:combobox') {
    return (
      <FormComboBoxItem
        form={form}
        id={widget.key}
        rules={requiredRule}
        label={widget.inputLabel}
        options={widget.options}
        placeholder={widget.placeholder}
        disabledAutoComplete={widget.disableAutoComplete}
      />
    );
  }

  if (widget.type === 'input:textarea') {
    return <TextArea form={form} id={widget.key} label={widget.inputLabel} rules={requiredRule} />;
  }

  if (widget.type === 'table') {
    return <FormTableWidget widget={widget} form={form} />;
  }

  if (widget.type === 'input:date') {
    return (
      <FormDatePickerItem
        form={form}
        id={widget.key}
        rules={requiredRule}
        inputLabel={widget.inputLabel}
        min={widget.min}
        max={widget.max}
      />
    );
  }

  if (widget.type === 'input:number') {
    return (
      <FormNumberInput
        form={form}
        id={widget.key}
        label={widget.inputLabel}
        rules={requiredRule}
        disabled={widget.disabled}
        allowScroll={widget.allowScroll}
        max={widget.max}
        min={widget.min}
        decimalScale={widget.decimalScale}
      />
    );
  }

  if (widget.type === 'input:text') {
    return (
      <FormTextInput
        id={widget.key}
        form={form}
        label={widget.inputLabel}
        rules={requiredRule}
        disabled={widget.disabled}
        defaultValue={widget.defaultValue}
        placeholder={widget.placeholder}
      />
    );
  }

  if (widget.type === 'input:radio') {
    return (
      <RadioGroupTiered
        form={form}
        id={widget.key}
        label={undefined}
        options={widget.options}
        rules={requiredRule}
      />
    );
  }

  if (widget.type === 'input:radio-v2') {
    return (
      <RadioGroupV2
        form={form}
        id={widget.key}
        label={undefined}
        options={widget.options}
        rules={requiredRule}
      />
    );
  }

  if (widget.type === 'input:time') {
    return (
      <FormTimeInput
        form={form}
        id={widget.key}
        label={widget.inputLabel}
        rules={requiredRule}
        disabled={widget.disabled}
      />
    );
  }

  if (widget.type === 'input:phone') {
    return (
      <FormPhoneInput
        form={form}
        id={widget.key}
        label={widget.inputLabel}
        rules={requiredRule}
        disabled={widget.disabled}
      />
    );
  }

  if (widget.type === 'multi-select') {
    return (
      <CheckboxList form={form} id={widget.key} rules={requiredRule} options={widget.options} />
    );
  }

  if (widget.type === 'tag-input') {
    return (
      <FormTagInputItem
        form={form}
        id={widget.key}
        options={widget.options}
        creatable={widget.creatable}
        inputLabel={widget.inputLabel}
        rules={requiredRule}
      />
    );
  }

  if (widget.type === 'alert-box-message') {
    return <AlertBoxMessageWidget form={form} widget={widget} />;
  }

  if (widget.type === 'entry-editor') {
    return <EntryEditorWidget form={form} widget={widget} />;
  }

  if (widget.type === 'rich-text') {
    return <FormRichTextEditor form={form} id={widget.key} rules={requiredRule} />;
  }

  if (widget.type === 'single-checkbox') {
    return (
      <CheckBox
        form={form}
        id={widget.key}
        rules={requiredRule}
        label={widget.checkboxLabel}
        disabled={widget.disabled}
      />
    );
  }

  if (widget.type === 'tag-input-v2') {
    return (
      <FormTagInputItemV2
        form={form}
        id={widget.key}
        options={widget.options}
        inputLabel={widget.inputLabel}
      />
    );
  }

  if (widget.type === 'conditional-tag-input') {
    return (
      <FormConditionalTagInput
        form={form}
        id={widget.key}
        rules={requiredRule}
        options={widget.options}
        inputLabel={widget.inputLabel}
      />
    );
  }

  if (widget.type === 'questions-with-date') {
    return <QuestionsWithDateWidget widget={widget} form={form} />;
  }

  throw new DeveloperError(`Widget not implemented: ${JSON.stringify(widget)}`);
}
