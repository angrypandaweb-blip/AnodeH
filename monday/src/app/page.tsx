import { createIdea, editIdea, removeIdea, removeSample } from "@/app/actions";
import { Submit } from "@/components/Submit";
import { openBoard } from "@/lib/board";
import { IDEA_STATUS, ERRORS } from "@/lib/copy";
import { ago, longDate, relativeDay } from "@/lib/dates";
import { viewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, current] = await Promise.all([searchParams, viewer()]);
  if (!current || current === "key") return null;
  const board = await openBoard(current);
  const waiting = board.ideas.filter((idea) => idea.status === "new" || idea.status === "discussing").length;
  const meeting = longDate(board.meetsOn);
  const error = params.error ? ERRORS[params.error] : undefined;

  return (
    <main className="sheet">
      <p className="kicker">Monday</p>
      <h1>Ideas for the meeting</h1>
      <p className="lede">Add them as they come up. On Monday the team decides who does what, and by when.</p>
      {error ? <p className="banner warn" role="status">{error}</p> : null}
      {board.hasSample ? (
        <form action={removeSample} className="banner">
          <p>Sample ideas are here so you can try the meeting. They stay on this preview until you clear them.</p>
          <Submit tone="quiet">Clear sample</Submit>
        </form>
      ) : null}

      <a className="jump" href="/monday">
        <span>Monday meeting</span>
        <strong>{relativeDay(board.today, board.meetsOn)}</strong>
        <em>
          {meeting.weekday} {meeting.day} {meeting.month}
          {" · "}
          {waiting === 0 ? "Nothing waiting" : waiting === 1 ? "1 idea to discuss" : `${waiting} ideas to discuss`}
        </em>
      </a>

      <form action={createIdea} className="stack-form composer">
        <label>
          Idea
          <input name="title" required maxLength={140} placeholder="What should we build?" autoComplete="off" />
        </label>
        <label>
          Detail
          <textarea name="body" maxLength={2000} rows={3} placeholder="Optional. A sentence is enough." />
        </label>
        <Submit>Add idea</Submit>
      </form>

      {board.ideas.length === 0 ? (
        <section className="empty">
          <h2>Nothing here yet</h2>
          <p>The first idea can be rough. Monday is where it becomes a task.</p>
        </section>
      ) : (
        <ul className="cards">
          {board.ideas.map((idea) => (
            <li key={idea.id} className="card">
              <div className="card-top">
                <span className={`pill ${idea.status}`}>{IDEA_STATUS[idea.status]}</span>
                {idea.sample ? <span className="pill sample">Sample</span> : null}
              </div>
              <h2>{idea.title}</h2>
              {idea.body ? <p>{idea.body}</p> : null}
              <p className="meta">{idea.authorName} · {ago(board.today, idea.createdAt)}</p>
              {idea.authorId === current.sub ? (
                <details>
                  <summary>Edit</summary>
                  <form action={editIdea} className="stack-form">
                    <input type="hidden" name="id" value={idea.id} />
                    <label>
                      Idea
                      <input name="title" required maxLength={140} defaultValue={idea.title} />
                    </label>
                    <label>
                      Detail
                      <textarea name="body" maxLength={2000} rows={3} defaultValue={idea.body} />
                    </label>
                    <Submit tone="quiet">Save idea</Submit>
                  </form>
                  <form action={removeIdea}>
                    <input type="hidden" name="id" value={idea.id} />
                    <Submit tone="danger">Remove idea</Submit>
                  </form>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="footnote">On a phone, add Monday to the home screen and it opens like an app.</p>
    </main>
  );
}
