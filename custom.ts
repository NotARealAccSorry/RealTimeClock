/**
 * Real Clock Extension for MakeCode Arcade
 * Provides a full suite of blocks for real-world time and date management.
 */

// Define the Time Unit Enum for the block dropdown menu
enum TimeField {
    //% block="Year"
    Year,
    //% block="Month"
    Month,
    //% block="Day"
    Day,
    //% block="Hour"
    Hour,
    //% block="Minute"
    Minute,
    //% block="Second"
    Second,
    //% block="Day of Week (0-6)"
    DayOfWeek
}

// Define the Timezone Enum for the block dropdown menu
enum Timezone {
    //% block="UTC / GMT"
    UTC = 0,
    //% block="EST (Eastern Standard Time / UTC-5)"
    EST = -5,
    //% block="CST (Central Standard Time / UTC-6)"
    CST = -6,
    //% block="MST (Mountain Standard Time / UTC-7)"
    MST = -7,
    //% block="PST (Pacific Standard Time / UTC-8)"
    PST = -8,
    //% block="AKST (Alaska Standard Time / UTC-9)"
    AKST = -9,
    //% block="HST (Hawaii Standard Time / UTC-10)"
    HST = -10,
    //% block="CET (Central European Time / UTC+1)"
    CET = 1,
    //% block="EET (Eastern European Time / UTC+2)"
    EET = 2,
    //% block="AEST (Australian Eastern Time / UTC+10)"
    AEST = 10
}

//% color="#4b0082" icon="\uf017" block="Real Clock"
//% groups='["Setup", "Time Components", "Status", "Formatting"]'
namespace realClock {
    let savedTimezoneOffset = 0;
    let isMenuOpen = false;
    let baseUnixTime = 0;
    let baseMillis = 0;

    /**
     * Synchronize the clock with a Unix timestamp (seconds).
     * Necessary for hardware without a real-time clock.
     */
    //% block="sync clock with Unix timestamp %timestamp"
    //% group="Setup"
    //% weight=100
    export function syncTime(timestamp: number): void {
        baseUnixTime = timestamp;
        baseMillis = control.millis();
    }

    /**
     * Sets the local timezone.
     */
    //% block="set local timezone to %tz"
    //% group="Setup"
    //% weight=90
    export function setTimezone(tz: Timezone): void {
        savedTimezoneOffset = tz;
    }

    /**
     * Gets a specific component of the current real-world time.
     */
    //% block="current %field"
    //% group="Time Components"
    //% weight=80
    export function getTime(field: TimeField): number {
        let dObj = getCurrentDateResult();
        switch (field) {
            case TimeField.Year: return dObj.year;
            case TimeField.Month: return dObj.month;
            case TimeField.Day: return dObj.day;
            case TimeField.Hour: return dObj.hour;
            case TimeField.Minute: return dObj.minute;
            case TimeField.Second: return dObj.second;
            case TimeField.DayOfWeek: return dObj.dayOfWeek;
            default: return 0;
        }
    }

    /**
     * Returns true if it is currently night time (6:00 PM to 6:00 AM).
     */
    //% block="is night time"
    //% group="Status"
    export function isNightTime(): boolean {
        let h = getTime(TimeField.Hour);
        return h >= 18 || h < 6;
    }

    /**
     * Returns true if it is currently day time (6:00 AM to 6:00 PM).
     */
    //% block="is day time"
    //% group="Status"
    export function isDayTime(): boolean {
        return !isNightTime();
    }

    /**
     * Returns true if the current time is AM.
     */
    //% block="is AM"
    //% group="Status"
    export function isAM(): boolean {
        return getTime(TimeField.Hour) < 12;
    }

    /**
     * Returns true if the current time is PM.
     */
    //% block="is PM"
    //% group="Status"
    export function isPM(): boolean {
        return !isAM();
    }

    /**
     * Returns true if it is currently morning (6 AM to 12 PM).
     */
    //% block="is morning"
    //% group="Status"
    export function isMorning(): boolean {
        let h = getTime(TimeField.Hour);
        return h >= 6 && h < 12;
    }

    /**
     * Returns true if it is currently afternoon (12 PM to 6 PM).
     */
    //% block="is afternoon"
    //% group="Status"
    export function isAfternoon(): boolean {
        let h = getTime(TimeField.Hour);
        return h >= 12 && h < 18;
    }

    /**
     * Returns true if it is currently evening (6 PM to 12 AM).
     */
    //% block="is evening"
    //% group="Status"
    export function isEvening(): boolean {
        let h = getTime(TimeField.Hour);
        return h >= 18;
    }

    /**
     * Returns true if the current year is a leap year.
     */
    //% block="is leap year"
    //% group="Status"
    export function isLeapYear(): boolean {
        let y = getTime(TimeField.Year);
        return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
    }

    /**
     * Returns the current time as a formatted string.
     */
    //% block="get time as string || 12h format %format12h"
    //% format12h.defl=true
    //% group="Formatting"
    export function getTimeString(format12h: boolean = true): string {
        let h = getTime(TimeField.Hour);
        let m = getTime(TimeField.Minute);
        let s = getTime(TimeField.Second);
        let suffix = "";

        if (format12h) {
            suffix = h >= 12 ? " PM" : " AM";
            h = h % 12;
            if (h === 0) h = 12;
        }

        return pad(h) + ":" + pad(m) + ":" + pad(s) + suffix;
    }

    /**
     * Returns the current date as a formatted string (YYYY-MM-DD).
     */
    //% block="get date as string"
    //% group="Formatting"
    export function getDateString(): string {
        let y = getTime(TimeField.Year);
        let m = getTime(TimeField.Month);
        let d = getTime(TimeField.Day);
        return y + "-" + pad(m) + "-" + pad(d);
    }

    /**
     * Returns the name of the current month.
     */
    //% block="current month name"
    //% group="Formatting"
    export function getMonthName(): string {
        let names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return names[getTime(TimeField.Month) - 1];
    }

    /**
     * Returns the name of the current day of the week.
     */
    //% block="current day name"
    //% group="Formatting"
    export function getDayName(): string {
        let names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return names[getTime(TimeField.DayOfWeek)];
    }

    /**
     * Prompts the player to select their local timezone from a scrolling menu.
     */
    //% block="ask player for timezone via menu"
    //% group="Setup"
    export function askPlayerForTimezoneMenu(): void {
        if (isMenuOpen) return;
        isMenuOpen = true;

        let names = ["UTC / GMT", "EST (Eastern)", "CST (Central)", "MST (Mountain)", "PST (Pacific)", "AKST (Alaska)", "HST (Hawaii)", "CET (Europe)", "EET (E. Europe)", "AEST (Australia)"];
        let offsets = [0, -5, -6, -7, -8, -9, -10, 1, 2, 10];
        let selectedIndex = 0;

        game.pushScene();

        controller.up.onEvent(ControllerButtonEvent.Pressed, function() {
            selectedIndex = (selectedIndex - 1 + names.length) % names.length;
        });

        controller.down.onEvent(ControllerButtonEvent.Pressed, function() {
            selectedIndex = (selectedIndex + 1) % names.length;
        });

        game.onUpdate(function() {
            if (!isMenuOpen) return;
            if (controller.A.isPressed()) {
                savedTimezoneOffset = offsets[selectedIndex];
                isMenuOpen = false;
                game.popScene();
            }
        });

        game.onPaint(function() {
            screen.fill(15);
            screen.print("SELECT YOUR TIMEZONE:", 10, 8, 4);
            screen.drawLine(10, 18, 150, 18, 4);

            let startIdx = Math.max(0, selectedIndex - 2);
            if (startIdx + 5 > names.length) startIdx = Math.max(0, names.length - 5);

            for (let i = 0; i < 5; i++) {
                let currentItem = startIdx + i;
                if (currentItem >= names.length) break;

                let yPos = 26 + (i * 14);
                if (currentItem === selectedIndex) {
                    screen.fillRect(6, yPos - 2, 148, 13, 5);
                    screen.print("> " + names[currentItem], 10, yPos, 1);
                } else {
                    screen.print(" " + names[currentItem], 10, yPos, 9);
                }
            }
            screen.print("Press [A] to Confirm", 20, 105, 7);
        });

        while (isMenuOpen) {
            pause(20);
        }
    }

    // --- Private Logic (Not Exported) ---

    function getCurrentDateResult(): DateResult {
        let elapsedSeconds = Math.idiv(control.millis() - baseMillis, 1000);
        let timestamp = baseUnixTime + elapsedSeconds + (savedTimezoneOffset * 3600);
        let dObj = timestampToDate(timestamp);
        if (isDSTActive(dObj.year, dObj.month, dObj.day, savedTimezoneOffset)) {
            timestamp += 3600;
            dObj = timestampToDate(timestamp);
        }
        return dObj;
    }

    function pad(num: number): string {
        return num < 10 ? "0" + num : "" + num;
    }

    function timestampToDate(ts: number): DateResult {
        let seconds = ts % 60;
        let minutes = Math.idiv(ts, 60) % 60;
        let hours = Math.idiv(ts, 3600) % 24;
        let totalDays = Math.idiv(ts, 86400);
        let dayOfWeek = (totalDays + 4) % 7;

        let year = 1970;
        while (true) {
            let dy = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
            if (totalDays < dy) break;
            totalDays -= dy;
            year++;
        }

        let isLeap = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
        let daysInMonths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let month = 0;
        while (totalDays >= daysInMonths[month]) {
            totalDays -= daysInMonths[month];
            month++;
        }

        return { year: year, month: month + 1, day: totalDays + 1, hour: hours, minute: minutes, second: seconds, dayOfWeek: dayOfWeek };
    }

    function isDSTActive(year: number, month: number, day: number, tz: number): boolean {
        // Simplified check: North American DST (March to November)
        if (tz <= -5 && tz >= -8) {
            if (month < 3 || month > 11) return false;
            if (month > 3 && month < 11) return true;
            return true;
        }
        return false;
    }

    interface DateResult {
        year: number; month: number; day: number;
        hour: number; minute: number; second: number;
        dayOfWeek: number;
    }
}
