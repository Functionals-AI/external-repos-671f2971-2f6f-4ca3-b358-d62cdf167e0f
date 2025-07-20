import { useSpecificModalContext } from '@/modules/modal/context';
import Modal from '@/modules/modal/ui/modal';
import { Button } from '@/ui-components/button';
import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import React from 'react';
import { Trans } from 'react-i18next';
import { ProviderCustomTask } from './types';
import Icon from '@/ui-components/icons/Icon';
import { FormV2, useForm } from '@/modules/form/form';
import usePutProviderTask from 'api/provider/usePutProviderTask';
import CheckBox from '@/ui-components/radio-and-checkbox/checkbox';
import useToaster from 'hooks/useToaster';

interface UpdateTaskFields {
  status: boolean;
}

interface CustomTaskModalProps {
  task: ProviderCustomTask;
}

export default function CustomTaskModal({ task }: CustomTaskModalProps) {
  const modal = useSpecificModalContext();
  const { post: putProviderTask } = usePutProviderTask(task.taskId);
  const toaster = useToaster();
  const form = useForm<UpdateTaskFields>({
    defaultValues: {
      status: task.status === 'todo' ? false : true,
    },
  });

  function handleSubmit(values: UpdateTaskFields) {
    putProviderTask({
      payload: {
        task: {
          status: values.status === true ? 'completed' : 'todo',
        },
      },
    })
      .then(() => {
        toaster.success({ title: 'Successfully updated task' });
      })
      .catch((error) => {
        toaster.apiError({ error, title: 'Unable to update task' });
      })
      .finally(() => modal.closeModal());
  }

  return (
    <Modal size="md">
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Header title={<Trans>Task details</Trans>} />
        <Modal.Body>
          <Section title={<Trans>Task</Trans>}>
            <div className="flex gap-x-4">
              <CheckBox form={form} id="status" label={task.name} />
              <Icon
                name="flag---filled"
                color={
                  task.priority === 'low'
                    ? 'neutral'
                    : task.priority === 'medium'
                    ? 'statusAmber'
                    : 'statusRed'
                }
              />
            </div>
            {task.note && <DataDisplay label={<Trans>Note</Trans>} content={task.note} />}
            {task.dueDate && (
              <DataDisplay
                label={<Trans>Due</Trans>}
                content={task.dueDate.toFormat('LLLL dd, yyyy')}
              />
            )}
          </Section>
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Button variant="secondary" onClick={() => modal.closeModal()}>
              Cancel
            </Button>
            <Button type="submit">
              <Trans>Save and close</Trans>
            </Button>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
