import "server-only";
import { addDays, asInstant, asIsoDate, isIsoDate, johannesburgToday, meetingMonday } from "@/lib/dates";
import { sql } from "@/lib/db";
import type { Viewer } from "@/lib/viewer";

export type IdeaStatus = "new" | "discussing" | "accepted" | "parked";
export type TaskStatus = "todo" | "doing" | "done";
export type FieldError = "title" | "person" | "date" | "long" | "missing" | "full";
export type SaveResult = { ok: true } | { ok: false; error: FieldError };

const TITLE = 140;
const BODY = 2000;
const NOTES = 4000;
const NAME = 80;

export type PersonRow = {
  id: string;
  name: string;
  source: "account" | "named";
  sample: boolean;
};

export type IdeaRow = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  status: IdeaStatus;
  sample: boolean;
  createdAt: Date;
};

export type TaskRow = {
  id: string;
  ideaId: string | null;
  ideaTitle: string | null;
  title: string;
  assigneeId: string | null;
  assigneeName: string | null;
  dueOn: string | null;
  status: TaskStatus;
  sample: boolean;
};

export type BoardData = {
  today: string;
  meetsOn: string;
  people: PersonRow[];
  ideas: IdeaRow[];
  tasks: TaskRow[];
  launchOn: string | null;
  notes: string;
  hasSample: boolean;
};

type PersonRecord = { id: string; name: string; source: string; sample: boolean };
type IdeaRecord = {
  id: string;
  title: string;
  body: string;
  author_id: string;
  author_name: string;
  status: string;
  sample: boolean;
  created_at: unknown;
};
type TaskRecord = {
  id: string;
  idea_id: string | null;
  idea_title: string | null;
  title: string;
  assignee_id: string | null;
  assignee_name: string | null;
  due_on: unknown;
  status: string;
  sample: boolean;
};

function displayName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.slice(0, NAME) : "Teammate";
}

async function countRows(table: "ideas" | "tasks" | "people", stage: string): Promise<number> {
  const query =
    table === "ideas"
      ? "select count(*)::int as n from ideas where stage = $1"
      : table === "tasks"
        ? "select count(*)::int as n from tasks where stage = $1"
        : "select count(*)::int as n from people where stage = $1";
  const rows = await sql<{ n: number | string }>(query, [stage]);
  return Number(rows[0]?.n ?? 0);
}

function limited(value: string, max: number): string | null {
  const trimmed = value.trim();
  if (trimmed.length > max) return null;
  return trimmed;
}

export async function openBoard(person: Viewer): Promise<BoardData> {
  const name = displayName(person.name);
  await sql(
    `insert into people (stage, id, name, email, source, seen_at)
     values ($1, $2, $3, $4, 'account', now())
     on conflict (stage, id) do update
       set name = excluded.name,
           email = excluded.email,
           source = 'account',
           sample = false,
           seen_at = now()`,
    [person.stage, person.sub, name, person.email.trim().slice(0, 200)],
  );
  const today = johannesburgToday();
  const meetsOn = meetingMonday(today.iso, today.weekday);
  await ensureSeed(person.stage, person.sub, meetsOn);
  return loadBoard(person.stage, today.iso, meetsOn);
}

async function ensureSeed(stage: string, authorId: string, meetsOn: string): Promise<void> {
  if ((process.env.DATABASE_URL ?? "").trim() !== "") return;
  const existing = await sql<{ seeded: boolean }>("select seeded from board where stage = $1", [stage]);
  if (existing[0]?.seeded) return;
  const launchOn = addDays(meetsOn, 21);
  const today = johannesburgToday().iso;
  await sql(
    `insert into people (stage, id, name, email, source, sample) values
      ($1, 'sample:amina', 'Amina Nkosi', '', 'named', true),
      ($1, 'sample:lindi', 'Lindi Dlamini', '', 'named', true),
      ($1, 'sample:josh', 'Josh Meyer', '', 'named', true)
     on conflict (stage, id) do nothing`,
    [stage],
  );
  await sql(
    `insert into ideas (stage, id, title, body, author_id, status, sample) values
      ($1, 'sample:icon', 'A home screen icon so Monday opens like an app', 'People should be able to tap it from the phone, the same way they open anything else.', $2, 'accepted', true),
      ($1, 'sample:fast', 'Add an idea from the phone in a few seconds', 'The title is enough. Detail can wait until the meeting.', 'sample:josh', 'discussing', true),
      ($1, 'sample:screen', 'Keep the Monday meeting on one screen', 'Agenda, decision, and who it is handed to, without a second tool.', 'sample:lindi', 'new', true),
      ($1, 'sample:assign', 'Every task needs a person and a date', 'If nobody owns it, it will not be done before launch.', $2, 'accepted', true),
      ($1, 'sample:launch', 'Put a launch day where the whole team can see it', 'The timeline should end on that day.', $2, 'accepted', true),
      ($1, 'sample:desktop', 'Build a desktop version first', 'We can park this. The people adding ideas are on their phones.', 'sample:amina', 'parked', true)
     on conflict (stage, id) do nothing`,
    [stage, authorId],
  );
  await sql(
    `insert into tasks (stage, id, idea_id, title, assignee_id, due_on, status, sample) values
      ($1, 'sample:task-icon', 'sample:icon', 'Draw the home screen icon', 'sample:amina', $2, 'todo', true),
      ($1, 'sample:task-form', 'sample:assign', 'Check the task form on a phone', 'sample:lindi', $3, 'doing', true),
      ($1, 'sample:task-launch', 'sample:launch', 'Agree the launch day in the meeting', $4, $5, 'todo', true),
      ($1, 'sample:task-done', 'sample:icon', 'Try the icon at a small size', 'sample:josh', $6, 'done', true)
     on conflict (stage, id) do nothing`,
    [stage, addDays(today, 3), addDays(today, 6), authorId, addDays(today, 1), addDays(today, -2)],
  );
  await sql(
    `insert into meetings (stage, meets_on, notes) values ($1, $2, $3)
     on conflict (stage, meets_on) do update set notes = excluded.notes`,
    [stage, meetsOn, "Decide the launch day, and who draws the home screen icon."],
  );
  await sql(
    `insert into board (stage, seeded, launch_on) values ($1, true, $2)
     on conflict (stage) do update
       set seeded = true,
           launch_on = coalesce(board.launch_on, excluded.launch_on)`,
    [stage, launchOn],
  );
}

export async function loadBoard(stage: string, today: string, meetsOn: string): Promise<BoardData> {
  const [people, ideas, tasks, board, meeting] = await Promise.all([
    sql<PersonRecord>(
      "select id, name, source, sample from people where stage = $1 order by name",
      [stage],
    ),
    sql<IdeaRecord>(
      `select i.id, i.title, i.body, i.author_id, p.name as author_name, i.status, i.sample, i.created_at
       from ideas i
       join people p on p.stage = i.stage and p.id = i.author_id
       where i.stage = $1
       order by i.created_at desc`,
      [stage],
    ),
    sql<TaskRecord>(
      `select t.id, t.idea_id, i.title as idea_title, t.title, t.assignee_id, p.name as assignee_name,
              t.due_on, t.status, t.sample
       from tasks t
       left join ideas i on i.stage = t.stage and i.id = t.idea_id
       left join people p on p.stage = t.stage and p.id = t.assignee_id
       where t.stage = $1
       order by t.due_on nulls last, t.created_at`,
      [stage],
    ),
    sql<{ launch_on: unknown }>("select launch_on from board where stage = $1", [stage]),
    sql<{ notes: string }>("select notes from meetings where stage = $1 and meets_on = $2", [stage, meetsOn]),
  ]);

  const ideaRows = ideas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    body: idea.body,
    authorId: idea.author_id,
    authorName: idea.author_name,
    status: idea.status as IdeaStatus,
    sample: idea.sample,
    createdAt: asInstant(idea.created_at),
  }));
  const taskRows = tasks.map((task) => ({
    id: task.id,
    ideaId: task.idea_id,
    ideaTitle: task.idea_title,
    title: task.title,
    assigneeId: task.assignee_id,
    assigneeName: task.assignee_name,
    dueOn: asIsoDate(task.due_on),
    status: task.status as TaskStatus,
    sample: task.sample,
  }));
  const personRows = people.map((person) => ({
    id: person.id,
    name: person.name,
    source: person.source === "named" ? "named" as const : "account" as const,
    sample: person.sample,
  }));

  return {
    today,
    meetsOn,
    people: personRows,
    ideas: ideaRows,
    tasks: taskRows,
    launchOn: asIsoDate(board[0]?.launch_on),
    notes: meeting[0]?.notes ?? "",
    hasSample: personRows.some((person) => person.sample) || ideaRows.some((idea) => idea.sample) || taskRows.some((task) => task.sample),
  };
}

async function personIdFor(stage: string, assignee: string, newName: string): Promise<string | null> {
  if (assignee !== "new") {
    const found = await sql<{ id: string }>("select id from people where stage = $1 and id = $2", [stage, assignee]);
    return found[0]?.id ?? null;
  }
  const name = limited(newName, NAME);
  if (!name) return null;
  const existing = await sql<{ id: string }>(
    "select id from people where stage = $1 and lower(name) = lower($2) limit 1",
    [stage, name],
  );
  if (existing[0]) return existing[0].id;
  if (await countRows("people", stage) >= 150) return null;
  const id = `named:${crypto.randomUUID()}`;
  await sql(
    "insert into people (stage, id, name, email, source) values ($1, $2, $3, '', 'named')",
    [stage, id, name],
  );
  return id;
}

export async function addIdea(stage: string, authorId: string, title: string, body: string): Promise<SaveResult> {
  const cleanTitle = limited(title, TITLE);
  const cleanBody = limited(body, BODY);
  if (cleanTitle === null || cleanBody === null) return { ok: false, error: "long" };
  if (!cleanTitle) return { ok: false, error: "title" };
  if (await countRows("ideas", stage) >= 400) return { ok: false, error: "full" };
  await sql(
    "insert into ideas (stage, id, title, body, author_id) values ($1, $2, $3, $4, $5)",
    [stage, crypto.randomUUID(), cleanTitle, cleanBody, authorId],
  );
  return { ok: true };
}

export async function updateIdea(
  stage: string,
  authorId: string,
  id: string,
  title: string,
  body: string,
): Promise<SaveResult> {
  const cleanTitle = limited(title, TITLE);
  const cleanBody = limited(body, BODY);
  if (cleanTitle === null || cleanBody === null) return { ok: false, error: "long" };
  if (!cleanTitle) return { ok: false, error: "title" };
  const updated = await sql(
    "update ideas set title = $4, body = $5 where stage = $1 and id = $2 and author_id = $3 returning id",
    [stage, id, authorId, cleanTitle, cleanBody],
  );
  if (updated.length === 0) return { ok: false, error: "missing" };
  return { ok: true };
}

export async function deleteIdea(stage: string, authorId: string, id: string): Promise<SaveResult> {
  await sql("update tasks set idea_id = null where stage = $1 and idea_id = $2", [stage, id]);
  const removed = await sql(
    "delete from ideas where stage = $1 and id = $2 and author_id = $3 returning id",
    [stage, id, authorId],
  );
  if (removed.length === 0) return { ok: false, error: "missing" };
  return { ok: true };
}

export async function setIdeaStatus(stage: string, id: string, status: string): Promise<SaveResult> {
  if (status !== "new" && status !== "discussing" && status !== "accepted" && status !== "parked") {
    return { ok: false, error: "missing" };
  }
  const updated = await sql(
    "update ideas set status = $3 where stage = $1 and id = $2 returning id",
    [stage, id, status],
  );
  if (updated.length === 0) return { ok: false, error: "missing" };
  return { ok: true };
}

export async function addTask(
  stage: string,
  input: { ideaId: string; title: string; assignee: string; newName: string; due: string },
): Promise<SaveResult> {
  const title = limited(input.title, TITLE);
  if (title === null) return { ok: false, error: "long" };
  if (!title) return { ok: false, error: "title" };
  if (!isIsoDate(input.due)) return { ok: false, error: "date" };
  if (await countRows("tasks", stage) >= 800) return { ok: false, error: "full" };
  const assigneeId = await personIdFor(stage, input.assignee, input.newName);
  if (!assigneeId) return { ok: false, error: "person" };
  let ideaId: string | null = null;
  if (input.ideaId) {
    const idea = await sql<{ id: string }>("select id from ideas where stage = $1 and id = $2", [stage, input.ideaId]);
    if (!idea[0]) return { ok: false, error: "missing" };
    ideaId = idea[0].id;
  }
  await sql(
    "insert into tasks (stage, id, idea_id, title, assignee_id, due_on) values ($1, $2, $3, $4, $5, $6)",
    [stage, crypto.randomUUID(), ideaId, title, assigneeId, input.due],
  );
  return { ok: true };
}

export async function setTaskStatus(stage: string, id: string, status: string): Promise<SaveResult> {
  if (status !== "todo" && status !== "doing" && status !== "done") return { ok: false, error: "missing" };
  const updated = await sql(
    "update tasks set status = $3 where stage = $1 and id = $2 returning id",
    [stage, id, status],
  );
  if (updated.length === 0) return { ok: false, error: "missing" };
  return { ok: true };
}

export async function moveTask(
  stage: string,
  input: { id: string; assignee: string; newName: string; due: string },
): Promise<SaveResult> {
  if (!isIsoDate(input.due)) return { ok: false, error: "date" };
  const assigneeId = await personIdFor(stage, input.assignee, input.newName);
  if (!assigneeId) return { ok: false, error: "person" };
  const updated = await sql(
    "update tasks set assignee_id = $3, due_on = $4 where stage = $1 and id = $2 returning id",
    [stage, input.id, assigneeId, input.due],
  );
  if (updated.length === 0) return { ok: false, error: "missing" };
  return { ok: true };
}

export async function saveNotes(stage: string, meetsOn: string, notes: string): Promise<SaveResult> {
  const clean = limited(notes, NOTES);
  if (clean === null) return { ok: false, error: "long" };
  await sql(
    `insert into meetings (stage, meets_on, notes) values ($1, $2, $3)
     on conflict (stage, meets_on) do update set notes = excluded.notes`,
    [stage, meetsOn, clean],
  );
  return { ok: true };
}

export async function setLaunch(stage: string, launch: string): Promise<SaveResult> {
  if (!isIsoDate(launch)) return { ok: false, error: "date" };
  await sql(
    `insert into board (stage, launch_on, seeded) values ($1, $2, true)
     on conflict (stage) do update set launch_on = excluded.launch_on`,
    [stage, launch],
  );
  return { ok: true };
}

export async function clearSample(stage: string): Promise<void> {
  await sql(
    `update tasks set assignee_id = null
     where stage = $1 and assignee_id in (select id from people where stage = $1 and sample = true)`,
    [stage],
  );
  await sql(
    `update tasks set idea_id = null
     where stage = $1 and idea_id in (select id from ideas where stage = $1 and sample = true)`,
    [stage],
  );
  await sql("delete from tasks where stage = $1 and sample = true", [stage]);
  await sql("delete from ideas where stage = $1 and sample = true", [stage]);
  await sql("delete from people where stage = $1 and sample = true", [stage]);
  await sql("update meetings set notes = '' where stage = $1", [stage]);
}
