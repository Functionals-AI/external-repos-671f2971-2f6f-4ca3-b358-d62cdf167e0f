import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Button from '../../components/button';
import { useTranslation } from 'react-i18next';

interface NoAvailableAppointmentsProps {
  onBack?: () => void;
  buttonText: string;
}

export default function NoAvailableAppointments({
  onBack,
  buttonText,
}: NoAvailableAppointmentsProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="flex flex-col items-center justify-center p-6"
    >
      <p className="mb-8">
        {t(
          'ThereAreNoAvailableAppointments',
          'There are no available appointments with the selections you have made.',
        )}
        {` `}
        {t(
          'PleaseGoBackAndAdjustPreferences',
          'Please go back and adjust your preferences to see more results.',
        )}
      </p>
      <Button type="button" onClick={handleBack}>
        {buttonText}
      </Button>
    </motion.div>
  );
}
