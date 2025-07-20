import { BasicModalData } from '../types';
import Modal from '../ui/modal';

export default function BasicModal({ size, title, body, footer }: BasicModalData) {
  return (
    <Modal size={size ?? 'lg'}>
      <Modal.Header title={title} />
      <Modal.Body>{body}</Modal.Body>
      {footer}
    </Modal>
  );
}
