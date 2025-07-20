import Button, { ButtonProps } from './button';
import { useRouter } from 'next/router';

type ErrorPageButton = {
  text: string;
  href: string;
  type: 'internal' | 'external';
  buttonProps?: ButtonProps;
};

interface ErrorPageProps {
  code: number;
  title: string;
  buttons: ErrorPageButton[];
}

export default function ErrorPage({ code, title, buttons }: ErrorPageProps) {
  const router = useRouter();

  const handleClick = (button: ErrorPageButton) => {
    if (button.type === 'internal') {
      router.push(button.href);
    } else if (button.type === 'external') {
      window.open(button.href, '_blank');
    }
  };

  return (
    <div className="container flex flex-col items-center justify-center px-5 mx-auto mt-32">
      <div className="max-w-md text-center">
        <h2 className="mb-8 font-extrabold text-8xl dark:text-gray-600">
          <span className="sr-only">Error</span>
          {code}
        </h2>
        <p className="text-xl font-semibold md:text-2xl pb-4">{title}</p>
        <div className="flex justify-center gap-x-10">
          {buttons.map((button) => (
            <Button
              key={button.href}
              onClick={() => handleClick(button)}
              size="large"
              className="mt-4"
              {...button.buttonProps}
            >
              {button.text}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
