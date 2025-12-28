import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

const dateObj = dayjs;

dateObj.extend(utc);
dateObj.extend(timezone);
dateObj.extend(customParseFormat);

// Set default timezone to Bogotá
dateObj.tz.setDefault('America/Bogota');

export default dateObj;
