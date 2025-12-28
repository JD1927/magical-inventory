import dayjs from '../date/date.config';

export class DateHelper {
  private static readonly FORMAT = 'YYYY-MM-DD';
  private static readonly TZ = 'America/Bogota';

  static toStartOfDay(date?: string) {
    if (!date) return null;
    return dayjs
      .tz(date, DateHelper.FORMAT, DateHelper.TZ)
      .startOf('day')
      .utc()
      .toDate();
  }

  static toEndOfDay(date?: string) {
    if (!date) return null;
    return dayjs
      .tz(date, DateHelper.FORMAT, DateHelper.TZ)
      .endOf('day')
      .utc()
      .toDate();
  }
}
