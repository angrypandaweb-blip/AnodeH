const chats = [
  {
    initials: "OP",
    color: "#0f8f8a",
    name: "Operations",
    preview: "Bontle: Can we meet this week?",
    time: "08:55",
    unread: 3,
  },
  {
    initials: "ED",
    color: "#e86a4a",
    name: "Enocentcia",
    preview: "Thank you!",
    time: "08:57",
  },
  {
    initials: "IN",
    color: "#1a3344",
    name: "Investors",
    preview: "Looking forward to the Q4 call.",
    time: "Yest.",
    unread: 1,
  },
  {
    initials: "VE",
    color: "#c9852a",
    name: "Val Electric",
    preview: "Site visit confirmed Thursday.",
    time: "Yest.",
  },
];

export function PhoneMock() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="glow-orb" />
      <div className="phone">
        <div className="phone-screen">
          <div className="phone-top">
            <small>Crewlyft</small>
            <strong>Good morning</strong>
          </div>
          <div className="chat-list">
            {chats.map((chat) => (
              <div className="chat-row" key={chat.name}>
                <div className="avatar" style={{ background: chat.color }}>
                  {chat.initials}
                </div>
                <div>
                  <b>{chat.name}</b>
                  <span>{chat.preview}</span>
                </div>
                <div className="chat-meta">
                  <div>{chat.time}</div>
                  {chat.unread ? <span className="badge">{chat.unread}</span> : null}
                </div>
              </div>
            ))}
          </div>
          <div className="phone-tabs">
            <span className="on">Chats</span>
            <span>People</span>
            <span>News</span>
          </div>
        </div>
      </div>
    </div>
  );
}
