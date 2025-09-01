import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Bogotá
dayjs.tz.setDefault('America/Bogota');

export default dayjs;
