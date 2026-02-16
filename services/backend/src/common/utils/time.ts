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
     * Get the start of today in IST (00:00:00.000 IST)
     * Returns a Date object representing midnight IST
     */
    static startOfTodayIST(): Date {
        const todayStr = this.getISTDateString();
        // Parse the date string as IST timezone to get midnight IST
        const startOfDay = new Date(`${todayStr}T00:00:00.000+05:30`);
        return startOfDay;
    }

    /**
     * Get the end of today in IST (23:59:59.999 IST)
     * Returns a Date object representing the last millisecond of today IST
     */
    static endOfTodayIST(): Date {
        const todayStr = this.getISTDateString();
        // Parse the date string as IST timezone to get end of day IST
        const endOfDay = new Date(`${todayStr}T23:59:59.999+05:30`);
        return endOfDay;
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
