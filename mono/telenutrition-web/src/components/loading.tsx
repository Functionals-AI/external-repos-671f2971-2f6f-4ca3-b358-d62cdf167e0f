import { CSSProperties } from 'react';

interface LoadingProps {
  wrapperStyle?: CSSProperties;
}

export default function Loading({ wrapperStyle = {} }: LoadingProps) {
  return (
    <div
      className="flex justify-center items-center"
      style={{ minHeight: '20rem', ...wrapperStyle }}
    >
      <div
        style={{ borderTopColor: 'transparent' }}
        className="w-16 h-16 border-4 border-f-dark-green border-solid rounded-full animate-spin"
      ></div>
    </div>
  );
}
