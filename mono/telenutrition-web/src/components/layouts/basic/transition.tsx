import { AnimatePresence, AnimationProps, HTMLMotionProps, motion } from 'framer-motion';
import { useEffect } from 'react';

const animationVariants: AnimationProps['variants'] = {
  enter: (direction: 1 | -1) => {
    return {
      // x: direction > 0 ? 100 : -100,
      opacity: 0,
    };
  },
  center: {
    zIndex: 1,
    // x: 0,
    opacity: 1,
  },
  exit: (direction: 1 | -1) => {
    return {
      // zIndex: 0,
      // x: direction < 0 ? 100 : -100,
      opacity: 0,
    };
  },
};

interface FlowTransitionProps {
  transitionKey?: React.Key;
  direction?: 1 | -1;
  children: React.ReactNode;
  divProps?: HTMLMotionProps<'div'>;
}

export default function FlowTransition({
  transitionKey,
  direction,
  divProps,
  children,
}: FlowTransitionProps) {
  useEffect(() => {
    setTimeout(() => {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    }, 500);
  }, [transitionKey]);

  return (
    <AnimatePresence exitBeforeEnter custom={direction}>
      <motion.div
        custom={direction}
        key={transitionKey}
        variants={animationVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          // x: { type: 'spring', duration: 0.2 },
          opacity: { duration: 0.3 },
        }}
        {...divProps}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
