import { useEffect, useState } from 'react';

export default function useUpdateStateOnInterval(ms: number) {
  const [_, update] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      update((v) => v + 1);
    }, ms);

    return () => clearInterval(interval);
  }, []);
}
