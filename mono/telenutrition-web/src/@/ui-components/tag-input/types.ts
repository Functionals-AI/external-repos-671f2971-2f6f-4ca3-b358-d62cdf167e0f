export type TagInputOption = {
  value: string;
  label: string;
  type: 'predefined' | 'custom';
  disabled?: boolean;

  /** Group the options by providing key. */
  // [key: string]: string | boolean | undefined;
};

export interface GroupTagInputOption {
  [key: string]: TagInputOption[];
}
