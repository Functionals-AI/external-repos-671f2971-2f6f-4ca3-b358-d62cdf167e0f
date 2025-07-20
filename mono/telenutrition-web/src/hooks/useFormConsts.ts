import { useTranslation } from 'react-i18next';

export default function useFormConsts() {
  const { t } = useTranslation();

  return {
    states: [
      {
        value: 'AL',
        label: 'Alabama',
      },
      {
        value: 'AK',
        label: 'Alaska',
      },
      {
        value: 'AZ',
        label: 'Arizona',
      },
      {
        value: 'AR',
        label: 'Arkansas',
      },
      {
        value: 'CA',
        label: 'California',
      },
      {
        value: 'CO',
        label: 'Colorado',
      },
      {
        value: 'CT',
        label: 'Connecticut',
      },
      {
        value: 'DE',
        label: 'Delaware',
      },
      {
        value: 'DC',
        label: 'District of Columbia',
      },
      {
        value: 'FL',
        label: 'Florida',
      },
      {
        value: 'GA',
        label: 'Georgia',
      },
      {
        value: 'HI',
        label: 'Hawaii',
      },
      {
        value: 'ID',
        label: 'Idaho',
      },
      {
        value: 'IL',
        label: 'Illinois',
      },
      {
        value: 'IN',
        label: 'Indiana',
      },
      {
        value: 'IA',
        label: 'Iowa',
      },
      {
        value: 'KS',
        label: 'Kansas',
      },
      {
        value: 'KY',
        label: 'Kentucky',
      },
      {
        value: 'LA',
        label: 'Louisiana',
      },
      {
        value: 'ME',
        label: 'Maine',
      },
      {
        value: 'MD',
        label: 'Maryland',
      },
      {
        value: 'MA',
        label: 'Massachusetts',
      },
      {
        value: 'MI',
        label: 'Michigan',
      },
      {
        value: 'MN',
        label: 'Minnesota',
      },
      {
        value: 'MS',
        label: 'Mississippi',
      },
      {
        value: 'MO',
        label: 'Missouri',
      },
      {
        value: 'MT',
        label: 'Montana',
      },
      {
        value: 'NE',
        label: 'Nebraska',
      },
      {
        value: 'NV',
        label: 'Nevada',
      },
      {
        value: 'NH',
        label: 'New Hampshire',
      },
      {
        value: 'NJ',
        label: 'New Jersey',
      },
      {
        value: 'NM',
        label: 'New Mexico',
      },
      {
        value: 'NY',
        label: 'New York',
      },
      {
        value: 'NC',
        label: 'North Carolina',
      },
      {
        value: 'ND',
        label: 'North Dakota',
      },
      {
        value: 'OH',
        label: 'Ohio',
      },
      {
        value: 'OK',
        label: 'Oklahoma',
      },
      {
        value: 'OR',
        label: 'Oregon',
      },
      {
        value: 'PA',
        label: 'Pennsylvania',
      },
      {
        value: 'RI',
        label: 'Rhode Island',
      },
      {
        value: 'SC',
        label: 'South Carolina',
      },
      {
        value: 'SD',
        label: 'South Dakota',
      },
      {
        value: 'TN',
        label: 'Tennessee',
      },
      {
        value: 'TX',
        label: 'Texas',
      },
      {
        value: 'UT',
        label: 'Utah',
      },
      {
        value: 'VT',
        label: 'Vermont',
      },
      {
        value: 'VA',
        label: 'Virginia',
      },
      {
        value: 'VI',
        label: 'Virgin Islands',
      },
      {
        value: 'WA',
        label: 'Washington',
      },
      {
        value: 'WV',
        label: 'West Virginia',
      },
      {
        value: 'WI',
        label: 'Wisconsin',
      },
      {
        value: 'WY',
        label: 'Wyoming',
      },
    ],
    sexes: [
      {
        value: 'M',
        label: t('Male'),
      },
      {
        value: 'F',
        label: t('Female'),
      },
    ],
    religions: [
      {
        value: 'Christianity',
        label: t('Christianity'),
      },
      {
        value: 'Islam',
        label: t('Islam'),
      },
      {
        value: 'Buddhism',
        label: t('Buddhism'),
      },
      {
        value: 'Hinduism',
        label: t('Hinduism'),
      },
      {
        value: 'Judaism',
        label: t('Judaism'),
      },
    ],
    languages: [
      {
        value: 'EN',
        label: t('English'),
      },
      {
        value: 'ES',
        label: t('Spanish'),
      },
    ],
    pronouns: [
      {
        value: 'he/him/his',
        label: 'he/him/his',
      },
      {
        value: 'she/her/hers',
        label: 'she/her/hers',
      },
      {
        value: 'they/them/theirs',
        label: 'they/them/theirs',
      },
    ],
  };
}
