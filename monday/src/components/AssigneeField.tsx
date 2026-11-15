"use client";

import { useState } from "react";

export function AssigneeField({
  people,
  selected,
}: {
  people: { id: string; name: string }[];
  selected?: string;
}) {
  const initial = selected && people.some((person) => person.id === selected) ? selected : (people[0]?.id ?? "new");
  const [choice, setChoice] = useState(initial);

  return (
    <>
      <label>
        Person
        <select name="assignee" value={choice} onChange={(event) => setChoice(event.target.value)} required>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
          <option value="new">Someone new</option>
        </select>
      </label>
      {choice === "new" ? (
        <label>
          Their name
          <input name="newName" required maxLength={80} placeholder="Who should do it" autoComplete="name" />
        </label>
      ) : null}
    </>
  );
}
