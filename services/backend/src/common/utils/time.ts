import { format, toZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

export class TimeService {
    /**
     * Get current time in IST
     */
    static getISTNow(): Date {
        return toZonedTime(new Date(), IST_TIMEZONE);
    }

    /**
     * Get current date string in IST (YYYY-MM-DD)
     */
    static getISTDateString(date: Date = new Date()): string {
        return format(toZonedTime(date, IST_TIMEZONE), 'yyyy-MM-dd', { timeZone: IST_TIMEZONE });
    }

    /**
     * Get the start of today in IST
     */
    static startOfTodayIST(): Date {
        const nowIST = this.getISTNow();
        nowIST.setHours(0, 0, 0, 0);
        return nowIST;
    }

    /**
     * Get yesterday's date string in IST
     */
    static getYesterdayISTDateString(): string {
        const nowIST = this.getISTNow();
        const yesterday = new Date(nowIST);
        yesterday.setDate(yesterday.getDate() - 1);
        return this.getISTDateString(yesterday);
    }
}
