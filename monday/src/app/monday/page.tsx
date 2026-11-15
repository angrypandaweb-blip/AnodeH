import { decideIdea, keepNotes } from "@/app/actions";
import { Submit } from "@/components/Submit";
import { TaskForm } from "@/components/TaskForm";
import { openBoard, type IdeaRow, type TaskRow } from "@/lib/board";
import { ERRORS, TASK_STATUS } from "@/lib/copy";
import { longDate, relativeDay } from "@/lib/dates";
import { viewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function MondayPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, current] = await Promise.all([searchParams, viewer()]);
  if (!current || current === "key") return null;
  const board = await openBoard(current);
  const error = params.error ? ERRORS[params.error] : undefined;
  const when = longDate(board.meetsOn);
  const today = board.today === board.meetsOn;
  const people = board.people.map((person) => ({ id: person.id, name: person.name }));
  const agenda = board.ideas
    .filter((idea) => idea.status === "new" || idea.status === "discussing")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "discussing" ? -1 : 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  const accepted = board.ideas.filter((idea) => idea.status === "accepted");
  const parked = board.ideas.filter((idea) => idea.status === "parked");

  return (
    <main className="sheet">
      <section className="plate">
        <p className="kicker">{today ? "The meeting is today" : "Next meeting"}</p>
        <h1>
          <span>{when.weekday}</span>
          {when.day}
        </h1>
        <p className="plate-month">{when.month}</p>
        <p className="plate-when">{today ? "Work through the list, then hand each idea to someone." : relativeDay(board.today, board.meetsOn)}</p>
      </section>
      {error ? <p className="banner warn" role="status">{error}</p> : null}

      <form action={keepNotes} className="stack-form">
        <label>
          Notes for this Monday
          <textarea name="notes" maxLength={4000} rows={3} defaultValue={board.notes} placeholder="What has to be decided before you leave the meeting?" />
        </label>
        <Submit tone="quiet">Save notes</Submit>
      </form>

      <section>
        <h2>To discuss</h2>
        {agenda.length === 0 ? (
          <p className="empty-line">Nothing is waiting. New ideas land here.</p>
        ) : (
          <ul className="cards">
            {agenda.map((idea) => (
              <li key={idea.id} className="card">
                <IdeaBody idea={idea} />
                <div className="choice">
                  <Decision id={idea.id} status="discussing" pressed={idea.status === "discussing"}>Discuss</Decision>
                  <Decision id={idea.id} status="accepted">Accept</Decision>
                  <Decision id={idea.id} status="parked">Park</Decision>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Hand out</h2>
        {accepted.length === 0 ? (
          <p className="empty-line">Accept an idea, then give it a person and a due date.</p>
        ) : (
          <ul className="cards">
            {accepted.map((idea) => {
              const tasks = board.tasks.filter((task) => task.ideaId === idea.id);
              return (
                <li key={idea.id} className="card">
                  <IdeaBody idea={idea} />
                  {tasks.length > 0 ? <TaskList tasks={tasks} /> : null}
                  <TaskForm people={people} ideaId={idea.id} defaultTitle={idea.title} returnTo="/monday" />
                  <Decision id={idea.id} status="parked" quiet>Park instead</Decision>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {parked.length > 0 ? (
        <section>
          <h2>Parked</h2>
          <ul className="cards">
            {parked.map((idea) => (
              <li key={idea.id} className="card muted-card">
                <IdeaBody idea={idea} />
                <Decision id={idea.id} status="new" quiet>Put back on the agenda</Decision>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <a className="jump" href="/timeline">
        <span>Launch timeline</span>
        <strong>{board.tasks.length === 1 ? "1 task" : `${board.tasks.length} tasks`}</strong>
        <em>{board.launchOn ? `Launch ${longDate(board.launchOn).day} ${longDate(board.launchOn).month}` : "Set a launch day"}</em>
      </a>
    </main>
  );
}

function Decision({
  id,
  status,
  pressed = false,
  quiet = false,
  children,
}: {
  id: string;
  status: string;
  pressed?: boolean;
  quiet?: boolean;
  children: string;
}) {
  return (
    <form action={decideIdea}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={quiet ? "textish" : undefined} aria-pressed={pressed}>{children}</button>
    </form>
  );
}

function IdeaBody({ idea }: { idea: IdeaRow }) {
  return (
    <>
      <h3>{idea.title}</h3>
      {idea.body ? <p>{idea.body}</p> : null}
      <p className="meta">{idea.authorName}</p>
    </>
  );
}

function TaskList({ tasks }: { tasks: TaskRow[] }) {
  return (
    <ul className="mini">
      {tasks.map((task) => (
        <li key={task.id}>
          <strong>{task.title}</strong>
          <span>{task.assigneeName ?? "Unassigned"} · {task.dueOn ?? "No date"} · {TASK_STATUS[task.status]}</span>
        </li>
      ))}
    </ul>
  );
}
