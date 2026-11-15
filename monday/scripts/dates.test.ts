import assert from "node:assert/strict";
import test from "node:test";
import { addDays, isIsoDate, johannesburgToday, meetingMonday, relativeDay } from "../src/lib/dates.ts";

test("the meeting is today when today is Monday", () => {
  assert.equal(meetingMonday("2026-11-16", "Mon"), "2026-11-16");
});

test("Tuesday waits for the coming Monday", () => {
  assert.equal(meetingMonday("2026-11-17", "Tue"), "2026-11-23");
});

test("Sunday's meeting is the next day", () => {
  assert.equal(meetingMonday("2026-11-15", "Sun"), "2026-11-16");
});

test("Johannesburg's Monday starts before UTC midnight", () => {
  const day = johannesburgToday(new Date("2026-11-15T22:30:00Z"));
  assert.equal(day.iso, "2026-11-16");
  assert.equal(day.weekday, "Mon");
});

test("calendar dates reject impossible days", () => {
  assert.equal(isIsoDate("2026-02-31"), false);
  assert.equal(isIsoDate("2026-11-16"), true);
  assert.equal(addDays("2026-11-16", 21), "2026-12-07");
});

test("relative days read from the meeting", () => {
  assert.equal(relativeDay("2026-11-15", "2026-11-16"), "Tomorrow");
  assert.equal(relativeDay("2026-11-16", "2026-11-16"), "Today");
  assert.equal(relativeDay("2026-11-18", "2026-11-16"), "2 days overdue");
});
