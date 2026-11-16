export type ActivityRange = "day" | "week" | "month" | "all";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function johannesburgDate(now: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Johannesburg",
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

function startOfDay(year: number, month: number, day: number) {
  const monthText = String(month).padStart(2, "0");
  const dayText = String(day).padStart(2, "0");
  return Math.floor(Date.parse(`${year}-${monthText}-${dayText}T00:00:00+02:00`) / 1000);
}

export function activitySince(range: ActivityRange, now = Date.now()): number | null {
  if (range === "all") return null;
  const date = johannesburgDate(now);
  const today = startOfDay(date.year, date.month, date.day);
  if (range === "day") return today;
  if (range === "month") return startOfDay(date.year, date.month, 1);
  const index = WEEKDAYS.indexOf(date.weekday);
  const mondayOffset = index <= 0 ? 6 : index - 1;
  return today - mondayOffset * 86400;
}
