export function Mark({ tone = "brand" }: { tone?: "brand" | "light" }) {
  const shield = tone === "brand" ? "#0b3d91" : "#efe7d8";
  const cursor = tone === "brand" ? "#ffffff" : "#14211b";
  const slash = tone === "brand" ? "#ff6a00" : "#e0b15a";

  return (
    <span className="mark" aria-hidden>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 1.7 20.6 5.3v6.7c0 4.8-3.5 8.2-8.6 9.9-5.1-1.7-8.6-5.1-8.6-9.9V5.3L12 1.7Z"
          fill={shield}
        />
        <path
          d="M8.6 7.4v8.1l2.1-1.8 1.7 3.3 1.4-.7-1.7-3.3 2.6-.3L8.6 7.4Z"
          fill={cursor}
        />
        <path d="M7.4 16.2 15.8 8" stroke={slash} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}
