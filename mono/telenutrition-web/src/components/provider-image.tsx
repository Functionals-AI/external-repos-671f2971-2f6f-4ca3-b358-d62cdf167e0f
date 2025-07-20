import { useState } from 'react';
import Avocado from '../../public/avocado.svg';

interface ProviderImageProps {
  provider: {
    initials: string;
    name: string;
    photo?: string;
  };
}

export default function ProviderImage({
  provider: { photo, name, initials },
}: ProviderImageProps) {
  const [isFallback, setIsFallback] = useState(false);

  if (isFallback || !photo) {
    return (
      <div
        className={`w-28 h-28 rounded-full border-f-dark-green border-2 border-solid flex justify-center items-center bg-f-light-green text-4xl text-white font-extrabold`}
      >
        {initials}
      </div>
    );
  }

  if (photo === '/avocado.svg') {
    return (
      <Avocado class="w-28 h-28 rounded-full border-f-dark-green border-2 border-solid flex justify-center items-center overflow-hidden" />
    );
  }

  return (
    <img
      alt={name}
      src={photo}
      className="w-28 h-28 rounded-full border-f-dark-green border-2 border-solid"
      onError={() => setIsFallback(true)}
    />
  );
}
