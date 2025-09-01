import dayjs from '../date/date.config';

export const toStartOfDay = (date: string | undefined) => {
  if (!date) return null;
  return dayjs.tz(date).startOf('day').utc().toDate();
};

export const toEndOfDay = (date: string | undefined) => {
  if (!date) return null;
  return dayjs.tz(date).endOf('day').utc().toDate();
};
