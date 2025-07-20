import { AnimatePresence, motion } from 'framer-motion';
import Loading from './loading';

export default function LoadingOverlay() {
  return (
    <AnimatePresence exitBeforeEnter>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Loading
          wrapperStyle={{
            position: 'absolute',
            top: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgb(0,0,0,0.15)',
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
