import React, { useEffect } from "react";
import { FormV2 } from '../form/form';
import { Button } from '@/ui-components/button';
import TextArea from '@/ui-components/text-area';
import { useForm } from "react-hook-form";

interface NewCommentProps {
  onAdd: (content: string) => void;
}

type NewCommentForm = {
  newComment: string;
}

export default function NewComment({ onAdd }: NewCommentProps) {
  const form = useForm<NewCommentForm>();

  useEffect(() => void form.watch(), [form.watch]);

  const isValid = !!form.getValues().newComment?.length;

  return (
    <FormV2 form={form} onSubmit={(value) => {
      onAdd(value.newComment);
      form.setValue("newComment", "")
    }}>
      <div className="flex flex-col gap-4 bg-neutral-100 p-4">
        <TextArea id="newComment" form={form} placeholder="Comment" />
        <div className="flex flex-row-reverse">
          <Button type="submit" size='sm' disabled={!isValid}>Add comment</Button>
        </div>
      </div>
    </FormV2>
  )
}