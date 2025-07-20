import { useMotionValue, useTransform, motion } from 'framer-motion';
import { useEffect } from 'react';
import { ProgressValues } from '../../../modules/flows/scheduling/helpers';

export default function ProgressBar({ total, progress }: ProgressValues) {
  const step = useMotionValue(progress);
  const width = useTransform(step, [0, total], ['0%', '100%']);

  useEffect(() => {
    step.set(progress);
  }, [progress]);

  return (
    <motion.div
      className="rounded-sm bg-f-very-dark-green sticky top-18 left-0 z-50"
      style={{
        height: 5,
        top: 64,
      }}
      animate={{
        width: width.get(),
      }}
      transition={{
        duration: 0.5,
      }}
    />
  );
}
