import { assignTask } from "@/app/actions";
import { AssigneeField } from "@/components/AssigneeField";
import { Submit } from "@/components/Submit";

export function TaskForm({
  people,
  ideaId,
  defaultTitle,
  returnTo,
}: {
  people: { id: string; name: string }[];
  ideaId?: string;
  defaultTitle?: string;
  returnTo: "/" | "/monday" | "/timeline";
}) {
  return (
    <form action={assignTask} className="stack-form">
      <input type="hidden" name="return" value={returnTo} />
      {ideaId ? <input type="hidden" name="ideaId" value={ideaId} /> : null}
      <label>
        Task
        <input name="title" required maxLength={140} defaultValue={defaultTitle} placeholder="What exactly should they do?" />
      </label>
      <AssigneeField people={people} />
      <label>
        Due
        <input name="due" type="date" required />
      </label>
      <Submit>Assign task</Submit>
    </form>
  );
}
