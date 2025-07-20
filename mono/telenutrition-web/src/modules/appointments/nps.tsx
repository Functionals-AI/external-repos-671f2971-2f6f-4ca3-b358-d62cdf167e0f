import { FormV2 } from '@/modules/form/form';
import { FormItemLabel } from '@/modules/form/ui';
import { Button } from '@/ui-components/button';
import { FormControl, FormField, FormItemRules } from '@/ui-components/form/form';
import CheckBox from '@/ui-components/radio-and-checkbox/checkbox';
import TextArea from '@/ui-components/text-area';
import usePostAppointmentNPS from 'api/usePostAppointmentNPS';
import Loading from 'components/loading';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { FieldValues, Path, UseFormReturn, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { COLORS } from 'utils/colors';
import parse from 'html-react-parser';

const GOOGLE_REVIEW_LINK = 'https://www.google.com/maps/place//data=!4m3!3m2!1s0x808580f588e1005f:0xe4a629e27f00ed76!12e1?source=g.page.m.dd._&laa=lu-desktop-reviews-dialog-review-solicitation'

export interface StarIconProps {
  size?: number
  strokeColor?: string
  strokeWidth?: string | number
  filled?: boolean,
}

export function StarIcon({
  size = 50,
  strokeColor = COLORS['f-yellow'],
  strokeWidth = 2,
  filled = false,
}: StarIconProps) {
  return (
    <svg
      stroke={strokeColor}
      fill={filled ? strokeColor : '#FFFFFFFF'}
      strokeWidth={strokeWidth}
      viewBox='0 0 24 24'
      width={size}
      height={size}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'></path>
    </svg>
  )
}

interface RatingBarProps<Values extends FieldValues> {
  dataTestId?: string;
  label?: ReactNode;
  form: UseFormReturn<Values>;
  rules?: FormItemRules<Values>;
  id: Path<Values>;
}

function RatingBar<Values extends FieldValues>({
  dataTestId,
  label,
  id,
  form,
  rules,
}: RatingBarProps<Values>) {
  let rating = form.getValues()[id]
  const [hoverScore, setHoverScore] = useState<number | undefined>(() => rating);
  const onHover = (hover: boolean, i: number) => setHoverScore((prev) => !hover && prev == i ? rating : i)

  return (
    <FormField
      rules={rules}
      control={form.control}
      name={id}
      render={({ field }) => (
        <div className="rounded-md w-full p-2 flex flex-col focusable">
          {label ? (
            <div className="flex w-full justify-between text-sm text-neutral-700">
              <FormItemLabel id={id} label={label} required={!!rules?.required} className='text-lg' />
            </div>
          ) : null}
          <FormControl data-testid={dataTestId}>
            <div className='inline-block pt-8'>
              <div className='flex flex-row justify-between'>
                <p className='font-semibold'>Not likely</p>
                <p className='font-semibold'>Very likely</p>
              </div>
              <div className="flex flex-wrap justify-center">
                {Array(11).fill(0).map((_, i) => (
                  <div
                    key={i}
                    className='cursor-pointer mt-2 mb-2 p-2 text-center'
                    onClick={() => { field.onChange(i) }}
                    onMouseOver={() => onHover(true, i)}
                    onMouseOut={() => onHover(false, i)}
                    >
                    <StarIcon
                      size={50}
                      filled={hoverScore !== undefined && hoverScore >= i}
                    />
                    <p className='mt-2'>{i}</p>
                  </div>
                ))}
              </div>
            </div>
          </FormControl>
        </div>
      )}
    />
  );
}

interface NPSFeedackProps {
  defaultScore?: number
  onSubmit: (values: NPSFeedbackForm) => void;
}

type NPSFeedbackForm = {
  score: number;
  comments: string;
  serviceScore: number;
  serviceComments: string;
  additionalFeedback: string;
  testimonialConsent?: boolean;
}

function NPSFeedback({ defaultScore, onSubmit }: NPSFeedackProps) {
  const form = useForm<NPSFeedbackForm>({
    defaultValues: {
      score: defaultScore
    }
  });

  const { t } = useTranslation();

  useEffect(() => void form.watch(), [form.watch]);

  const isPromoter = (values: NPSFeedbackForm) => values.score > 8 || values.serviceScore > 8
  return (
    <FormV2 form={form} onSubmit={({ testimonialConsent, ...values }) => onSubmit({
      ...values,
      ...(isPromoter(values) && {
        testimonialConsent,
      })
    })}>
      <div className="mx-auto space-y-8">
        <div>
          <RatingBar
            id="serviceScore"
            form={form}
            rules={{ required: true }}
            label={t('NPSFeedbackService', "On a scale of 0-10, how likely are you to recommend Foodsmart's service to family or friends?")}/>
          <TextArea
            id="serviceComments"
            form={form}
            rules={{ required: true }}
            label={t('NPSFeedbackReason', 'What is the primary reason for your score?')}
            placeholder="Comments" />
        </div>
        <div>
          <RatingBar
            id="score"
            form={form}
            rules={{ required: true }}
            label={t('NPSFeedbackDietitian', "On a scale of 0-10, how likely are you to recommend your Foodsmart dietitian to family or friends?")}/>
          <TextArea
            id="comments"
            form={form}
            rules={{ required: true }}
            label={t('NPSFeedbackReason', 'What is the primary reason for your score?')}
            placeholder="Comments" />
        </div>
        <TextArea
          id="additionalFeedback"
          form={form}
          label={t('DietitianFeedback', "Please share any additional feedback on your experience with Foodsmart or your dietitian")}
          placeholder="Comments" />
          { isPromoter(form.getValues()) && (
            <div className='space-y-2'>
              <p>{t("NPSTestimonialPrompt", "Our dietitians love to hear about great experiences! Would you be open to sharing a testimonial on your experience with the Foodsmart team?")}</p>
              <CheckBox
                id="testimonialConsent"
                form={form}
                label={t("NPSTestimonialConsent", "Foodsmart can contact me about a potential testimonial")}
              />
            </div>
          )}
        <div className="flex flex-row-reverse">
          <Button type="submit" disabled={!form.formState.isValid}>Submit</Button>
        </div>
      </div>
    </FormV2>
  )
}

interface NPSAppointmentProps {
  appointmentId: string;
  oneTimeToken?: string;
  score?: number;
}

export default function NPSAppointment({
  appointmentId,
  oneTimeToken,
  score,
}: NPSAppointmentProps) {
  const { t } = useTranslation();
  const { post: postNPS, data: { isSubmitting, error, data } } = usePostAppointmentNPS({ appointmentId });
  const [isPromoter, setIsPromoter] = useState(false)

  if (isSubmitting) {
    return <Loading />
  } else if (data == null && error == null) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <h3 className='text-center'>{t('NPSFeedbackHeader','We appreciate your feedback!')}</h3>
        <p className='text-neutral-400 text-center mt-2 mb-12'>{t('NPSIncentive', "As a token of our appreciation for providing your feedback, you will be entered into a monthly raffle for a chance to win a $100 gift card for completing this survey.")}</p>
        <NPSFeedback
          defaultScore={score}
          onSubmit={(values) => {
            setIsPromoter(values.score > 8 && values.serviceScore > 8)
            postNPS({ payload: values }, oneTimeToken).catch(e => console.error(e))
          }}/>
      </div>
    )
  }

  const thankYouMessage = isPromoter ?
    parse(t('ThanksNPSFeedbackPromoter', 'Thank you for taking the time to provide your feedback! We’d appreciate it if you could provide a {{review}} and help spread the word with others who might benefit from Foodsmart.', {
      review: `<a target="_blank" href="${GOOGLE_REVIEW_LINK}">${t(
        'quick review',
        'quick review',
        )}</a>`
      })) :
    t('ThanksNPSFeedback', 'Thank you for taking the time to provide your feedback! We truly value your opinion and appreciate your feedback. Your input is crucial in helping us improve and continue to deliver the best experience possible.')

  return (
    <div className="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
      <h3>
        { error?.message == 'already-exists' ?
          t('ResponseAlreadySubmitted', 'A response has already been submitted for this appointment')
        : error ?
          t('ThereWasAnErrorWithYourRequest', 'There was an error with your request') :
          thankYouMessage
        }
      </h3>
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-md shadow">
          <Link href="/schedule/dashboard">
            <Button>{t('GoToYourDashboard', 'Go to your Dashboard')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
