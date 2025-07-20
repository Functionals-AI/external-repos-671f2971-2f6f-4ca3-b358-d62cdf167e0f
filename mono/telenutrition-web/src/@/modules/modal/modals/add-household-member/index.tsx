import Modal from '@/modules/modal/ui/modal';
import { useModal } from '../..';
import { AddHouseholdMemberModalData } from '../../types';
import { PatientProfile } from '@/features/provider/patient/profile/util';
import { SectionDivider } from '@/ui-components/section';
import { FormV2, useForm } from '@/modules/form/form';
import usePostPatients from 'api/usePostPatients';
import useToaster from 'hooks/useToaster';
import { Trans, useTranslation } from 'react-i18next';
import FullScreenLoading from '@/ui-components/loading/full-screen-loading';
import {
  PatientEditContactFormFieldsSection,
  PatientEditOverviewFormFieldsSection,
} from '@/features/provider/patient/profile/patient-edit-form-sections';

type AddHouseholdMemberModalState = PatientProfile;

export default function AddHouseholdMemberModal({
  holder,
  holderUserId,
}: AddHouseholdMemberModalData) {
  const modal = useModal();
  const toast = useToaster();
  const { t } = useTranslation();
  const form = useForm<AddHouseholdMemberModalState>({
    defaultValues: {
      phone: holder.phone,
      email: holder.email,
      address1: holder.address1,
      city: holder.city,
      state: holder.state,
      zipcode: holder.zipcode,
    },
  });
  const {
    post: postPatients,
    data: { isSubmitting },
  } = usePostPatients();

  const onSubmit = (values: AddHouseholdMemberModalState) => {
    postPatients({
      payload: {
        state: {
          firstName: values.firstName,
          lastName: values.lastName,
          sex: values.sex,
          address: values.address1,
          state: values.state,
          zipcode: values.zipcode,
          phoneMobile: values.phone,
          email: values.email,
          dob: values.birthday,
          ...(values.preferredName && { preferredName: values.preferredName }),
          ...(values.city && { city: values.city }),
          ...(values.pronouns && { pronouns: values.pronouns }),
        },
        userId: holderUserId,
      },
    })
      .then(() => {
        toast.success({
          title: t('Successfully created!'),
          message: t('A new patient has been created.'),
        });
      })
      .catch((e) => {
        toast.apiError({ title: t("Couldn't create a patient."), error: e });
      })
      .finally(() => modal.closeAll());
  };

  return (
    <Modal size="lg">
      {isSubmitting && <FullScreenLoading />}
      <FormV2 form={form} onSubmit={onSubmit}>
        <Modal.Header title={<Trans>Add member</Trans>} />
        <Modal.Body>
          <PatientEditOverviewFormFieldsSection form={form} />
          <SectionDivider />
          <PatientEditContactFormFieldsSection form={form} />
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Modal.Footer.SecondaryCloseButton>Cancel</Modal.Footer.SecondaryCloseButton>
            <Modal.Footer.PrimaryButton type="submit">
              <Trans>Add member</Trans>
            </Modal.Footer.PrimaryButton>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
