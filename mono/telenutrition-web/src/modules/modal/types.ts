export type ModalProps<T = unknown> = {
  closeModal: () => void;
  isOpen: boolean;
  payload: T;
};
