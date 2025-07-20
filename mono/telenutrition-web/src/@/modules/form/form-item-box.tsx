import { useFormField } from '@/ui-components/form/form';
import { FormItemBoxUi, FormItemBoxUiProps } from './ui';

export default function FormItemBox(props: Omit<FormItemBoxUiProps, 'isError'>) {
  const field = useFormField();

  return <FormItemBoxUi {...props} isError={!!field.error} />;
}
