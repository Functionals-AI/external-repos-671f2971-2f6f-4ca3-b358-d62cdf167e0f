import Button from '../../../../components/button';
import type { ButtonOptionsWidget as IButtonOptionsWidget } from '@mono/telenutrition/lib/types';
import { useWorkflowEngineContext } from '../workflow-engine/context';

interface ButtonOptionsWidgetProps {
  widget: IButtonOptionsWidget;
}

export default function ButtonOptionsWidget({ widget }: ButtonOptionsWidgetProps) {
  const { handleNext, form } = useWorkflowEngineContext();

  function handleClick(value: string | boolean) {
    if (widget.autoNavigateNextOnClick) {
      handleNext({ [widget.key]: value });
    } else {
      form.setValue(widget.key, value);
    }
  }

  return (
    <div className="flex justify-between flex-col md:flex-row gap-4">
      {widget.buttons.map((button) => (
        <Button key={String(button.value)} onClick={() => handleClick(button.value)}>
          {button.label}
        </Button>
      ))}
    </div>
  );
}
