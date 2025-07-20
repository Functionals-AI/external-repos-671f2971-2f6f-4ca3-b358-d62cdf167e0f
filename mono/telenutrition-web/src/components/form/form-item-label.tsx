import parse from 'html-react-parser';

interface FormItemLabelProps {
  name?: string | null;
  required?: boolean;
}

export default function FormItemLabel({ name, required = false }: FormItemLabelProps) {
  return name ? (
    <label htmlFor={name} className="text-base block font-bold">
      <span>{parse(name)}</span>
      {required ? <span style={{ color: 'red' }}> *</span> : ''}
    </label>
  ) : (
    <></>
  );
}
