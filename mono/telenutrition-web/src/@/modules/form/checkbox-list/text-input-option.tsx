import { FormControl, FormLabel } from '@/ui-components/form/form';
import { Checkbox } from '@/ui-components/checkbox';
import { Input as BaseInput } from '@/ui-components/form/input';
import { FormItem as RootFormItem } from '../../../ui-components/form/form';
import { ChangeEvent, useState } from 'react';
import { CheckboxListOption, CheckboxState } from '.';
import FormItemBox from '../form-item-box';

interface TextInputOptionProps {
  option: CheckboxListOption;
  value: CheckboxState;
  onChange: (value: string, state: CheckboxState) => void;
}

export default function TextInputOption({ option, value, onChange }: TextInputOptionProps) {
  const [isChecked, setIsChecked] = useState(false);

  function onCheckedChange(checked: boolean) {
    if (checked === false) {
      onChange(option.value, undefined);
    }
    setIsChecked(checked as boolean);
  }

  function onTextInputChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (v === '') {
      onChange(option.value, undefined);
    } else {
      onChange(option.value, v);
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex gap-x-2 items-center">
        <FormControl>
          <Checkbox
            disabled={option.disabled}
            className="cursor-pointer text-green-300"
            checked={isChecked}
            onCheckedChange={(checked) => {
              onCheckedChange(checked as boolean);
            }}
          />
        </FormControl>

        <div className="space-y-1 leading-none">
          <FormLabel className="cursor-pointer text-base font-normal text-neutral-600">
            {option.label}
          </FormLabel>
        </div>
      </div>
      {isChecked && (
        <RootFormItem>
          <FormItemBox>
            <BaseInput value={value as string} onChange={onTextInputChange} />
          </FormItemBox>
        </RootFormItem>
      )}
    </div>
  );
}
