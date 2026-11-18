"use client";

import { useId, useState } from "react";

export function PasswordField({
  name = "password",
  label,
  autoComplete,
  minLength,
  required = false,
  placeholder,
}: {
  name?: string;
  label: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label className="password-field" htmlFor={inputId}>
      {label}
      <span className="password-field-row">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}
