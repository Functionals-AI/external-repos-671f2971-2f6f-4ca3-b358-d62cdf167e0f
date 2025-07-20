import FormattedMessage from '../../../components/formatted-message';
import LegalWrapper from '../legal-wrapper';

const I18N_MESSAGES = {
  HEADING: {
    id: 'Disclaimer.Heading',
    defaultMessage: 'Disclaimer',
  },
  REVISION_DATE: {
    id: 'Disclaimer.RevisionDate',
    defaultMessage: 'Revised: April 17, 2013',
  },
  LINE_1: {
    id: 'Disclaimer.LineOne',
    defaultMessage:
      'The use of Zipongo (i) is provided for informational purposes only, (ii) is not a substitute ' +
      'for qualified and licensed medical advice, care, diagnosis or treatment, and (iii) is not designed to promote ' +
      'or endorse any medical practice, program or agenda. Any health related information found herein is available ' +
      'as part of a general educational and commercial service.',
  },
  LINE_2: {
    id: 'Disclaimer.LineTwo',
    defaultMessage:
      'Zipongo does not contain information about all diseases, nor does Zipongo contain all ' +
      'information that may be relevant to a particular medical or health condition. To treat or diagnose any type ' +
      'of health problem or issue and for questions regarding any medical condition or before you start any type of ' +
      'new treatment or alteration to your diet or lifestyle you should always consult a qualified medical health ' +
      'care provider. You should not use any information from Zipongo for diagnosing or treating a medical or health ' +
      'condition. Please consult with your own physician or health care specialist regarding the suggestions and ' +
      'recommendations made at <a href="http://www.zipongo.com">www.zipongo.com</a>. The use of Zipongo in no way establishes a doctor patient relationship ' +
      'in any way.',
  },
  LINE_3: {
    id: 'Disclaimer.LineThree',
    defaultMessage:
      'You should carefully read all information provided by the manufacturers of any products ' +
      'advertised or promoted on or through Zipongo and displayed on or in the associated product packaging and ' +
      'labels before purchasing and/or using such products.',
  },
  LINE_4: {
    id: 'Disclaimer.LineFour',
    defaultMessage:
      'If you have or suspect that you have a medical problem, you should contact your professional ' +
      'healthcare provider through appropriate means, and in emergency situations Dial 911.',
  },
  LINE_5: {
    id: 'Disclaimer.LineFive',
    defaultMessage:
      'You agree that you will not under any circumstances disregard any professional medical advice ' +
      'or delay in seeking such advice in reliance on any information from Zipongo provided on or through Zipongo. ' +
      'Reliance on any such information from Zipongo is solely at your own risk.',
  },
};

export default function Disclaimer() {
  return (
    <LegalWrapper currentTab="disclaimer">
      <div>
        <div>
          <div>
            <div>
              <h1>
                <FormattedMessage {...I18N_MESSAGES.HEADING} />
              </h1>
              <h3>
                <FormattedMessage {...I18N_MESSAGES.REVISION_DATE} />
              </h3>
              <p>
                <FormattedMessage {...I18N_MESSAGES.LINE_1} />
              </p>
              <p>
                <FormattedMessage {...I18N_MESSAGES.LINE_2} />
              </p>
              <p>
                <FormattedMessage {...I18N_MESSAGES.LINE_3} />
              </p>
              <p>
                <FormattedMessage {...I18N_MESSAGES.LINE_4} />
              </p>
              <p>
                <FormattedMessage {...I18N_MESSAGES.LINE_5} />
              </p>
            </div>
          </div>
        </div>
      </div>
    </LegalWrapper>
  );
}
