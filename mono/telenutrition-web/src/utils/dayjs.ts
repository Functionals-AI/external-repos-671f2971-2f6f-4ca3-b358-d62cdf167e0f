import dayjs from 'dayjs';

import dayjs_utc from 'dayjs/plugin/utc';
import dayjs_timezone from 'dayjs/plugin/timezone';
import dayjs_advanced from 'dayjs/plugin/advancedFormat';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(dayjs_utc);
dayjs.extend(dayjs_timezone);
dayjs.extend(dayjs_advanced);
dayjs.extend(LocalizedFormat);

export default dayjs;
