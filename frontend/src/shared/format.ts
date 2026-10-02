import dayjs from 'dayjs';

const DISPLAY_DATE_TIME_FORMAT = 'D MMM YYYY, HH:mm';

export const formatDateTime = (isoDateTime: string): string => dayjs(isoDateTime).format(DISPLAY_DATE_TIME_FORMAT);
