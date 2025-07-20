import { FormControl, FormField, FormItemRules } from '@/ui-components/form/form';
import RichTextEditor from '@/ui-components/rich-text';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

interface FormRichTextEditorProps<Values extends FieldValues> {
  form: UseFormReturn<Values>;
  id: Path<Values>;
  rules?: FormItemRules<Values>;
}

export default function FormRichTextEditor<Values extends FieldValues>({
  id,
  form,
  rules,
}: FormRichTextEditorProps<Values>) {
  return (
    <FormField
      control={form.control}
      name={id}
      rules={rules}
      render={({ field }) => (
        <FormControl>
          <RichTextEditor value={field.value ?? ''} onChange={(v) => field.onChange(v)} />
        </FormControl>
      )}
    />
  );
}
