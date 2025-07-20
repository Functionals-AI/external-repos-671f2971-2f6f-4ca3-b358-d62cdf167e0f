import { usePiiManagerContext } from './context';

const MIN_SCRUB_LENGTH = 10;

export default function usePiiManager() {
  const { isPiiHidden, setIsPiiHidden } = usePiiManagerContext();

  function wrap(sentence: string) {
    if (!isPiiHidden) return sentence;
    return sentence
      .split(' ')
      .filter((word) => word !== '')
      .map(
        (word) =>
          `${word[0]}${Array.from({ length: Math.min(word.length - 1, MIN_SCRUB_LENGTH) })
            .map(() => '*')
            .join('')}`,
      )
      .join(' ');
  }

  return { wrap, isPiiHidden, setIsPiiHidden };
}
