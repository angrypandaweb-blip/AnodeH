"use client";

import { useState } from "react";
import { createAllow } from "@/app/actions";

export function AllowForm({ ip }: { ip: string }) {
  const [value, setValue] = useState("");

  return (
    <form action={createAllow} className="form-grid">
      <label>
        Address
        <input
          type="text"
          name="value"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="198.51.100.24 or 198.51.100.0/24"
          aria-label="Address or range"
        />
      </label>
      <label>
        Note
        <input type="text" name="note" placeholder="Office" aria-label="Note" />
      </label>
      <div className="row-actions">
        <button type="submit">Add</button>
        <button className="ghost" type="button" disabled={!ip} onClick={() => setValue(ip)}>
          Use my IP
        </button>
      </div>
      {ip ? <small>Use my IP fills this box with the address this page sees.</small> : <small>Your address is not visible on this connection.</small>}
    </form>
  );
}
