"use server";

import { redirect } from "next/navigation";
import { johannesburgToday, meetingMonday } from "@/lib/dates";
import {
  addIdea,
  addTask,
  clearSample,
  deleteIdea,
  moveTask,
  saveNotes,
  setIdeaStatus,
  setLaunch,
  setTaskStatus,
  updateIdea,
  type FieldError,
} from "@/lib/board";
import { viewer, type Viewer } from "@/lib/viewer";

async function person(): Promise<Viewer> {
  const current = await viewer();
  if (!current || current === "key") redirect("/");
  return current;
}

function back(value: FormDataEntryValue | null): string {
  if (value === "/monday" || value === "/timeline" || value === "/") return value;
  return "/";
}

function fail(path: string, error: FieldError): never {
  redirect(`${path}?error=${error}`);
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createIdea(formData: FormData) {
  const current = await person();
  const result = await addIdea(current.stage, current.sub, field(formData, "title"), field(formData, "body"));
  if (!result.ok) fail("/", result.error);
  redirect("/");
}

export async function editIdea(formData: FormData) {
  const current = await person();
  const result = await updateIdea(
    current.stage,
    current.sub,
    field(formData, "id"),
    field(formData, "title"),
    field(formData, "body"),
  );
  if (!result.ok) fail("/", result.error);
  redirect("/");
}

export async function removeIdea(formData: FormData) {
  const current = await person();
  const result = await deleteIdea(current.stage, current.sub, field(formData, "id"));
  if (!result.ok) fail("/", result.error);
  redirect("/");
}

export async function decideIdea(formData: FormData) {
  const current = await person();
  const result = await setIdeaStatus(current.stage, field(formData, "id"), field(formData, "status"));
  if (!result.ok) fail("/monday", result.error);
  redirect("/monday");
}

export async function assignTask(formData: FormData) {
  const current = await person();
  const destination = back(formData.get("return"));
  const result = await addTask(current.stage, {
    ideaId: field(formData, "ideaId"),
    title: field(formData, "title"),
    assignee: field(formData, "assignee"),
    newName: field(formData, "newName"),
    due: field(formData, "due"),
  });
  if (!result.ok) fail(destination, result.error);
  redirect(destination);
}

export async function markTask(formData: FormData) {
  const current = await person();
  const destination = back(formData.get("return"));
  const result = await setTaskStatus(current.stage, field(formData, "id"), field(formData, "status"));
  if (!result.ok) fail(destination, result.error);
  redirect(destination);
}

export async function retask(formData: FormData) {
  const current = await person();
  const result = await moveTask(current.stage, {
    id: field(formData, "id"),
    assignee: field(formData, "assignee"),
    newName: field(formData, "newName"),
    due: field(formData, "due"),
  });
  if (!result.ok) fail("/timeline", result.error);
  redirect("/timeline");
}

export async function keepNotes(formData: FormData) {
  const current = await person();
  const today = johannesburgToday();
  const result = await saveNotes(
    current.stage,
    meetingMonday(today.iso, today.weekday),
    field(formData, "notes"),
  );
  if (!result.ok) fail("/monday", result.error);
  redirect("/monday");
}

export async function chooseLaunch(formData: FormData) {
  const current = await person();
  const result = await setLaunch(current.stage, field(formData, "launch"));
  if (!result.ok) fail("/timeline", result.error);
  redirect("/timeline");
}

export async function removeSample() {
  const current = await person();
  await clearSample(current.stage);
  redirect("/");
}
