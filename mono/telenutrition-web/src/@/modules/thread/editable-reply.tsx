import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/ui-components/button';

interface EditableReplyProps {
  type: 'new' | 'update';
  defaultValue?: string;
  onCancel: () => void;
  onSave: (content: string) => void;
}

const EditableReply = ({ type, defaultValue, onCancel, onSave }: EditableReplyProps) => {
  const [value, setValue] = useState(() => (type === 'update' ? `${defaultValue}` : ''));
  return (
    <>
      <div className="border border-neutral-150 rounded-md w-full p-2 flex flex-col focusable">
        <div className="flex w-full justify-between text-sm text-neutral-700">Comment</div>
        <textarea
          placeholder={'Comment'}
          style={{ resize: 'none' }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full min-h-[6rem] h-fit p-0 outline-none ring-0 border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <div className="flex flex-row-reverse gap-x-2 mt-2">
        <Button onClick={() => onSave(value)}>
          <Save /> {type === 'new' ? 'Save' : 'Update'}
        </Button>
        <Button variant="secondary" onClick={() => onCancel()}>
          {type === 'new' ? 'Close' : 'Discard changes'}
        </Button>
      </div>
    </>
  );
};

export default EditableReply;
