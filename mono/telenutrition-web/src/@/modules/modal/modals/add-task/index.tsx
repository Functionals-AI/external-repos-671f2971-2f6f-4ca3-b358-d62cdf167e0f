import Section from '@/ui-components/section';
import Modal from '../../ui/modal';
import { FormV2, useForm } from '@/modules/form/form';
import { Button } from '@/ui-components/button';
import { useTranslation } from 'react-i18next';
import DatePickerWidget from '@/modules/form/form-date-picker-item';
import { RadioGroupTieredValue } from '@/modules/form/radio-group-tiered';
import { useSpecificModalContext } from '../../context';
import { DateTime } from 'luxon';
import usePostProviderTask from 'api/provider/userPostProviderTask';
import FullScreenLoading from '@/ui-components/loading/full-screen-loading';
import useToaster from 'hooks/useToaster';

enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

interface TaskFields {
  name: string;
  note?: string;
  dueDate: string;
  priority: RadioGroupTieredValue;
}

export default function AddTaskModal() {
  const form = useForm<TaskFields>();
  const { t } = useTranslation();
  const modal = useSpecificModalContext();
  const { post: postProviderTask, data } = usePostProviderTask();
  const toaster = useToaster();

  function handleSubmit(values: TaskFields) {
    postProviderTask({
      payload: {
        task: {
          name: values.name,
          note: values.note,
          dueDate: values.dueDate,
          priority: values.priority as unknown as TaskPriority,
        },
      },
    })
      .then(() => {
        toaster.success({
          title: 'Task successfully added',
          message: `"${values.name}" has been added to your task list.`,
        });
      })
      .catch((error) => {
        toaster.apiError({ error, title: 'Failed to add task' });
      })
      .finally(() => {
        modal.closeModal();
      });
  }

  return (
    <Modal size="md">
      {data.isSubmitting && <FullScreenLoading />}
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Header title={t('Task details')} />
        <Modal.Body>
          <Section title={t('Task')} sectionClassName="flex flex-col gap-y-4">
            <FormV2.FormTextInput
              form={form}
              id="name"
              label={t('Task name')}
              rules={{ required: true }}
            />
            <FormV2.FormTextArea form={form} id="note" label={t('Label')} />
            <DatePickerWidget
              form={form}
              id="dueDate"
              inputLabel={t('Due date')}
              min={DateTime.now().toISO()}
            />
            <FormV2.FormRadioGroupTired
              form={form}
              id="priority"
              label={t('Priority')}
              rules={{ required: true }}
              options={[
                {
                  type: 'basic',
                  label: t('Low'),
                  value: TaskPriority.Low,
                },
                {
                  type: 'basic',
                  label: t('Medium'),
                  value: TaskPriority.Medium,
                },
                {
                  type: 'basic',
                  label: t('High'),
                  value: TaskPriority.High,
                },
              ]}
            />
          </Section>
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Button onClick={() => modal.closeModal()} variant="secondary">
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
