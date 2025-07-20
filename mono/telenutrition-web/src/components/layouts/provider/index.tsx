import { motion } from 'framer-motion';

interface ProviderLayoutProps {
  header: string;
  subheader?: string;
  children: React.ReactNode;
}

export default function ProviderLayout({ header, subheader, children }: ProviderLayoutProps) {
  return (
    <div className="relative py-12 max-w-7xl px-6 mx-auto">
      <div className="flex justify-between pb-2">
        <div className="h-20">
          <h2 className="font-extrabold text-neutral-1500 text-3xl">{header}</h2>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            exit={{ y: -10, opacity: 0 }}
          >
            <h3 className="font-medium text-neutral-700 text-lg">{subheader}</h3>
          </motion.div>
        </div>
      </div>
      {children}
    </div>
  );
}
