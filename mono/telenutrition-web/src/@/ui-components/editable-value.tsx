import { FormItemBoxUi, FormItemLabel } from '../modules/form/ui';
import { Input } from './form/input';
import IconButton from './button/icon';
import LinkButton from './button/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils';

export default function EditableValue({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (newValue: string) => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPressed);

    return () => document.removeEventListener('keydown', handleKeyPressed);
  }, []);

  function onSetIsEdit() {
    if (!inputRef.current) return;
    inputRef.current.focus();
    setIsEditing(true);
  }

  function handleCancel() {
    if (!inputRef.current) return;
    setInputValue(value);
    setIsEditing(false);
  }

  function handleSave() {
    onSave(inputValue);
    setIsEditing(false);
  }

  function handleKeyPressed(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      // handleSave();
    }
    if (event.key === 'Escape') {
      handleCancel();
    }
  }

  return (
    <FormItemBoxUi
      className={cn('flex-row border', isEditing ? 'border-neutral-150' : 'border-transparent')}
    >
      <div className="flex-1">
        <FormItemLabel id={''} label={label} />
        <div className="flex items-center gap-x-2">
          <Input
            ref={inputRef}
            readOnly={!isEditing}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
      </div>
      {isEditing ? (
        <div className="flex gap-x-2 items-center">
          <IconButton onClick={handleCancel} variant="tertiary" size="sm" iconName="x" />
          <IconButton onClick={handleSave} size="sm" iconName="save" />
        </div>
      ) : (
        <LinkButton size="sm" iconName={'edit'} onClick={onSetIsEdit}>
          Edit
        </LinkButton>
      )}
    </FormItemBoxUi>
  );
}
