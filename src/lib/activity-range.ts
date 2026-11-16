export type ActivityRange = "day" | "week" | "month" | "all";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function zonedDate(now: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(now));
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    weekday: value("weekday"),
  };
}

function zoneOffsetMs(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  const asUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
  return asUtc - utcMs;
}

export function startOfZonedDay(year: number, month: number, day: number, timeZone: string) {
  const utcMidnight = Date.UTC(year, month - 1, day);
  const offset = zoneOffsetMs(utcMidnight, timeZone);
  let start = utcMidnight - offset;
  const corrected = zoneOffsetMs(start, timeZone);
  if (corrected !== offset) start = utcMidnight - corrected;
  return Math.floor(start / 1000);
}

export function activitySince(range: ActivityRange, now = Date.now(), timeZone = "Africa/Johannesburg"): number | null {
  if (range === "all") return null;
  const date = zonedDate(now, timeZone);
  const today = startOfZonedDay(date.year, date.month, date.day, timeZone);
  if (range === "day") return today;
  if (range === "month") return startOfZonedDay(date.year, date.month, 1, timeZone);
  const index = WEEKDAYS.indexOf(date.weekday);
  const mondayOffset = index <= 0 ? 6 : index - 1;
  return today - mondayOffset * 86400;
}
