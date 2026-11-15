import { chooseLaunch, markTask, retask } from "@/app/actions";
import { AssigneeField } from "@/components/AssigneeField";
import { Submit } from "@/components/Submit";
import { TaskForm } from "@/components/TaskForm";
import { openBoard, type TaskRow } from "@/lib/board";
import { ERRORS } from "@/lib/copy";
import { longDate, relativeDay } from "@/lib/dates";
import { viewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, current] = await Promise.all([searchParams, viewer()]);
  if (!current || current === "key") return null;
  const board = await openBoard(current);
  const error = params.error ? ERRORS[params.error] : undefined;
  const people = board.people.map((person) => ({ id: person.id, name: person.name }));
  const done = board.tasks.filter((task) => task.status === "done").length;
  const overdue = board.tasks.filter((task) => task.dueOn && task.dueOn < board.today && task.status !== "done").length;
  const launch = board.launchOn ? longDate(board.launchOn) : null;

  type Mark =
    | { kind: "task"; sort: string; task: TaskRow }
    | { kind: "launch"; sort: string };
  const marks: Mark[] = board.tasks
    .filter((task) => task.dueOn)
    .map((task) => ({ kind: "task", sort: task.dueOn as string, task }));
  if (board.launchOn) marks.push({ kind: "launch", sort: board.launchOn });
  marks.sort((a, b) => a.sort.localeCompare(b.sort) || (a.kind === "launch" ? 1 : 0) - (b.kind === "launch" ? 1 : 0));
  const undated = board.tasks.filter((task) => !task.dueOn);

  return (
    <main className="sheet">
      <p className="kicker">Launch</p>
      <h1>{launch ? `${launch.day} ${launch.month}` : "Pick a launch day"}</h1>
      <p className="lede">
        {board.launchOn
          ? `${relativeDay(board.today, board.launchOn)}. ${done} of ${board.tasks.length} tasks done${overdue ? `, ${overdue} overdue` : ""}.`
          : "The Monday meeting fills this timeline. Each task has a person and a date, and the dates run up to launch."}
      </p>
      {error ? <p className="banner warn" role="status">{error}</p> : null}

      {board.tasks.length > 0 ? (
        <div className="progress" aria-hidden>
          <span style={{ width: `${Math.round((done / board.tasks.length) * 100)}%` }} />
        </div>
      ) : null}

      <form action={chooseLaunch} className="launch-form">
        <label>
          Launch day
          <input name="launch" type="date" required defaultValue={board.launchOn ?? ""} />
        </label>
        <Submit tone="quiet">Save</Submit>
      </form>

      {marks.length === 0 ? (
        <section className="empty">
          <h2>No dates yet</h2>
          <p>Accept an idea on Monday, then assign it. It will show up here in order.</p>
        </section>
      ) : (
        <ol className="rail">
          {marks.map((mark) =>
            mark.kind === "launch" ? (
              <li key="launch" className="launch-mark">
                <p className="meta">{longDate(mark.sort).weekday} {longDate(mark.sort).day} {longDate(mark.sort).month}</p>
                <h2>Launch</h2>
                <p>The app goes out.</p>
              </li>
            ) : (
              <li key={mark.task.id} className={mark.task.status === "done" ? "is-done" : mark.task.dueOn && mark.task.dueOn < board.today ? "is-late" : undefined}>
                <TaskBlock task={mark.task} today={board.today} viewerId={current.sub} people={people} />
              </li>
            ),
          )}
        </ol>
      )}

      {undated.length > 0 ? (
        <section>
          <h2>No date yet</h2>
          <ul className="cards">
            {undated.map((task) => (
              <li key={task.id} className="card">
                <TaskBlock task={task} today={board.today} viewerId={current.sub} people={people} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2>Add a task</h2>
        <p className="empty-line">For work that did not start as an idea.</p>
        <TaskForm people={people} returnTo="/timeline" />
      </section>
    </main>
  );
}

function TaskBlock({
  task,
  today,
  viewerId,
  people,
}: {
  task: TaskRow;
  today: string;
  viewerId: string;
  people: { id: string; name: string }[];
}) {
  const due = task.dueOn ? longDate(task.dueOn) : null;
  return (
    <article className="task">
      {due ? <p className="meta">{due.weekday} {due.day} {due.month} · {task.status === "done" ? "Done" : relativeDay(today, task.dueOn as string)}</p> : null}
      <h3>
        {task.title}
        {task.assigneeId === viewerId ? <span className="yours">Yours</span> : null}
      </h3>
      <p className="meta">{task.assigneeName ?? "Unassigned"}{task.ideaTitle ? ` · ${task.ideaTitle}` : ""}</p>
      <div className="segment">
        {(["todo", "doing", "done"] as const).map((status) => (
          <form key={status} action={markTask}>
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="return" value="/timeline" />
            <input type="hidden" name="status" value={status} />
            <button type="submit" aria-pressed={task.status === status}>
              {status === "todo" ? "To do" : status === "doing" ? "Doing" : "Done"}
            </button>
          </form>
        ))}
      </div>
      <details>
        <summary>Change person or date</summary>
        <form action={retask} className="stack-form">
          <input type="hidden" name="id" value={task.id} />
          <AssigneeField people={people} selected={task.assigneeId ?? undefined} />
          <label>
            Due
            <input name="due" type="date" required defaultValue={task.dueOn ?? ""} />
          </label>
          <Submit tone="quiet">Save change</Submit>
        </form>
      </details>
    </article>
  );
}
