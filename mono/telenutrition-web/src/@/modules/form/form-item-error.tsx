import { useFormField } from '@/ui-components/form/form';
import Icon from '@/ui-components/icons/Icon';

export default function FormItemError() {
  const { error, name } = useFormField();

  if (error) {
    return (
      <p
        data-testid={`form-item-error-${name}`}
        className="text-xs font-bold text-status-red-800 flex items-center gap-x-2"
      >
        <Icon name="alert-octagon" color="statusRed800" size="xs" />
        {error.message || 'Required'}
      </p>
    );
  } else {
    return null;
  }
}
