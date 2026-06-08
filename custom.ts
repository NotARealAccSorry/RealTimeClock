/**
 * Browser-based time and play-day tracking.
 */
//% color="#2F4F4F" icon="\uf017" block="Browser Events" weight=100
namespace browserEvents {

    /**
     * Safely reaches the browser window using core JS objects.
     */
    function fetchWin(): any {
        let m: any = Math;
        if (m && m["window"]) return m["window"];
        let o: any = Object;
        if (o && o["window"]) return o["window"];
        return undefined;
    }

    function runBrowserJS(code: string): any {
        let w = fetchWin();
        if (w && w["eval"]) {
            try {
                return w["eval"](code);
            } catch (e) {
                return 0;
            }
        }
        return 0;
    }

    //% block="browser hour" blockId="browser_get_hour"
    export function getBrowserHour(): number {
        return runBrowserJS("new Date().getHours()");
    }

    //% block="browser minute" blockId="browser_get_minute"
    export function getBrowserMinute(): number {
        return runBrowserJS("new Date().getMinutes()");
    }

    //% block="browser second" blockId="browser_get_second"
    export function getBrowserSecond(): number {
        return runBrowserJS("new Date().getSeconds()");
    }

    function getNowMs(): number {
        let w = fetchWin();
        if (w && w["Date"] && w["Date"]["now"]) {
            return w["Date"]["now"]();
        }
        return 0;
    }

    function syncDays() {
        let now = getNowMs();
        if (now === 0) return;

        if (!settings.exists("p_start_v4")) {
            settings.writeNumber("p_start_v4", now);
        }
        
        let today = Math.floor(now / 86400000);
        let last = settings.readNumber("p_last_v4");
        let total = settings.readNumber("p_total_v4");
        
        if (total === undefined) {
            settings.writeNumber("p_total_v4", 1);
            settings.writeNumber("p_last_v4", today);
        } else if (today !== last) {
            settings.writeNumber("p_total_v4", total + 1);
            settings.writeNumber("p_last_v4", today);
        }
    }

    //% block="total days played" blockId="browser_total_days_played"
    export function totalDaysPlayed(): number {
        syncDays();
        let v = settings.readNumber("p_total_v4");
        return v !== undefined ? v : 1;
    }

    //% block="days since first play" blockId="browser_days_since_first_play"
    export function daysSinceFirstPlay(): number {
        syncDays();
        let s = settings.readNumber("p_start_v4");
        if (!s) return 0;
        return Math.floor((getNowMs() - s) / 86400000);
    }
}

/**
 * Timezone-aware clock features.
 */
//% color="#4b0082" icon="\uf017" block="Real Clock" weight=90
namespace realClock {
    export enum TimeField {
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
        Second
    }

    export enum Timezone {
        //% block="BIT UTC-12"
        BIT = -12,
        //% block="SST UTC-11"
        SST = -11,
        //% block="HST UTC-10"
        HST = -10,
        //% block="HDT UTC-9"
        HDT = -9,
        //% block="PST UTC-8"
        PST = -8,
        //% block="MST UTC-7"
        MST = -7,
        //% block="CST UTC-6"
        CST = -6,
        //% block="EST UTC-5"
        EST = -5,
        //% block="AST UTC-4"
        AST = -4,
        //% block="ART UTC-3"
        ART = -3,
        //% block="FNT UTC-2"
        FNT = -2,
        //% block="AZOT UTC-1"
        AZOT = -1,
        //% block="UTC GMT"
        UTC = 0,
        //% block="CET UTC+1"
        CET = 1,
        //% block="EET UTC+2"
        EET = 2,
        //% block="MSK UTC+3"
        MSK = 3,
        //% block="GST UTC+4"
        GST = 4,
        //% block="PKT UTC+5"
        PKT = 5,
        //% block="BST UTC+6"
        BST = 6,
        //% block="WIB UTC+7"
        WIB = 7,
        //% block="AWST UTC+8"
        AWST = 8,
        //% block="JST UTC+9"
        JST = 9,
        //% block="AEST UTC+10"
        AEST = 10,
        //% block="SBT UTC+11"
        SBT = 11,
        //% block="NZST UTC+12"
        NZST = 12,
        //% block="PHOT UTC+13"
        PHOT = 13,
        //% block="LINT UTC+14"
        LINT = 14
    }

    let tzOff = 0;
    let menuIsVisible = false;

    function getWindowObj(): any {
        let m: any = Math;
        if (m && m["window"]) return m["window"];
        let o: any = Object;
        if (o && o["window"]) return o["window"];
        return undefined;
    }

    //% block="set local timezone to %tz" 
    export function setTimezone(tz: Timezone): void {
        tzOff = tz;
    }

    //% block="get clock time %field"
    export function getClockTime(field: TimeField): number {
        let win = getWindowObj();
        if (!win || !win["eval"]) return 0;
        
        let logic = "(function(t){" +
                    "  let d=new Date();" +
                    "  let u=d.getTime()+(d.getTimezoneOffset()*60000);" +
                    "  let n=new Date(u+(3600000*t));" +
                    "  return [n.getFullYear(),n.getMonth()+1,n.getDate(),n.getHours(),n.getMinutes(),n.getSeconds()];" +
                    "})(" + tzOff + ")";
        
        let res = win["eval"](logic);
        if (!res || res.length < 6) return 0;

        if (field === TimeField.Year) return res[0];
        if (field === TimeField.Month) return res[1];
        if (field === TimeField.Day) return res[2];
        if (field === TimeField.Hour) return res[3];
        if (field === TimeField.Minute) return res[4];
        if (field === TimeField.Second) return res[5];
        return 0;
    }

    //% block="ask player for timezone via menu with confirm button %confirmButton" confirmButton.defl=ControllerButton.A
    export function askPlayerForTimezoneMenu(confirmButton: ControllerButton = ControllerButton.A): void {
        if (menuIsVisible) return;
        menuIsVisible = true;

        let names = ["BIT UTC-12", "SST UTC-11", "HST UTC-10", "HDT UTC-9", "PST UTC-8", "MST UTC-7", "CST UTC-6", "EST UTC-5", "AST UTC-4", "ART UTC-3", "FNT UTC-2", "AZOT UTC-1", "UTC GMT", "CET UTC+1", "EET UTC+2", "MSK UTC+3", "GST UTC+4", "PKT UTC+5", "BST UTC+6", "WIB UTC+7", "AWST UTC+8", "JST UTC+9", "AEST UTC+10", "SBT UTC+11", "NZST UTC+12", "PHOT UTC+13", "LINT UTC+14"];
        let offsets = [-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        let idx = 12; 

        game.pushScene();

        controller.up.onEvent(ControllerButtonEvent.Pressed, function () { 
            idx = (idx - 1 + names.length) % names.length; 
        });
        controller.down.onEvent(ControllerButtonEvent.Pressed, function () { 
            idx = (idx + 1) % names.length; 
        });

        game.onUpdate(function () {
            if (!menuIsVisible) return;
            let check = false;
            if (confirmButton === ControllerButton.A && controller.A.isPressed()) check = true;
            else if (confirmButton === ControllerButton.B && controller.B.isPressed()) check = true;
            else if (confirmButton === ControllerButton.Left && controller.left.isPressed()) check = true;
            else if (confirmButton === ControllerButton.Right && controller.right.isPressed()) check = true;
            else if (confirmButton === ControllerButton.Up && controller.up.isPressed()) check = true;
            else if (confirmButton === ControllerButton.Down && controller.down.isPressed()) check = true;

            if (check) {
                tzOff = offsets[idx];
                menuIsVisible = false;
                game.popScene();
            }
        });

        game.onPaint(function () {
            screen.fill(15);
            screen.print("SELECT TIMEZONE", 10, 5, 4);
            let startRow = Math.max(0, Math.min(idx - 2, names.length - 5));
            for (let k = 0; k < 5; k++) {
                let curIdx = startRow + k;
                let yPos = 25 + (k * 15);
                if (curIdx === idx) {
                    screen.fillRect(5, yPos - 2, 150, 12, 4);
                    screen.print("> " + names[curIdx], 10, yPos, 5);
                } else {
                    screen.print("  " + names[curIdx], 10, yPos, 1);
                }
            }
        });
    }
}
