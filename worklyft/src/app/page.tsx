import { PhoneMock } from "@/components/PhoneMock";
import { Reveal } from "@/components/Reveal";
import { TopBar } from "@/components/TopBar";
import { APP_URL, DEMO_URL, site } from "@/lib/site";

const pillars = [
  {
    title: "Chats",
    body: "Private and group conversations for your team and clients — quotes, updates and decisions stay in one thread.",
  },
  {
    title: "People",
    body: "A live directory of everyone in the company, with roles, invites and the colleagues you need in a tap.",
  },
  {
    title: "News",
    body: "Company announcements that reach the whole workspace, with read tracking so leaders know who saw what.",
  },
];

const capabilities = [
  {
    title: "Book meetings in a tap",
    body: "Open any chat and schedule when everyone is free — no calendar ping-pong.",
  },
  {
    title: "Run the whole company",
    body: "Announcements, time off, clock-in, expenses and company files live beside your chats.",
  },
  {
    title: "Works anywhere",
    body: "Any country, currency and time zone, with dozens of languages so distributed teams stay aligned.",
  },
  {
    title: "An AI assistant on hand",
    body: "Ask what’s on today, book a meeting, or draft a promo — without leaving the workspace.",
  },
];

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main>
        <section className="hero">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="hero-brand" aria-label="WorkLyft">
                <span>WorkLyft</span>
              </p>
              <h1>{site.tagline}</h1>
              <p className="hero-lead">
                We market <strong>Crewlyft</strong> — one professional app for your team and clients:
                chat, meetings, tasks and decisions in the same place.
              </p>
              <div className="cta-row">
                <a className="btn btn-primary" href={APP_URL} target="_blank" rel="noreferrer">
                  Try Crewlyft free
                </a>
                <a className="btn btn-ghost" href={DEMO_URL} target="_blank" rel="noreferrer">
                  See the full demo
                </a>
              </div>
            </div>
            <PhoneMock />
          </div>
        </section>

        <section className="section" id="product">
          <div className="shell">
            <Reveal>
              <div className="section-head">
                <h2>Three pillars of the workday</h2>
                <p>
                  Crewlyft keeps the conversations, the people and the company updates that matter —
                  without scattering them across five other tools.
                </p>
              </div>
            </Reveal>
            <div className="pillars">
              {pillars.map((item) => (
                <Reveal key={item.title}>
                  <article className="pillar">
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="company">
          <div className="shell">
            <Reveal>
              <div className="section-head">
                <h2>More than messaging</h2>
                <p>Crewlyft replaces several apps with one workspace built for how businesses actually run.</p>
              </div>
            </Reveal>
            <div className="capabilities">
              {capabilities.map((item) => (
                <Reveal key={item.title}>
                  <article className="capability">
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="shell">
            <Reveal>
              <div className="section-head">
                <h2>Simple pricing</h2>
                <p>Start free. Subscribe when the team is ready — priced in your own currency.</p>
              </div>
            </Reveal>
            <div className="pricing">
              <Reveal>
                <div className="price-main">
                  <div className="amount">
                    7 days free <small>then from $59 / month</small>
                  </div>
                  <p>
                    Twenty members included. Add more seats as you grow. Yearly billing gives you two months
                    free. No card needed for the trial.
                  </p>
                  <ul className="price-notes">
                    <li>Staff, clients, investors and guests all count as members</li>
                    <li>Cancel anytime — monthly or at the end of a yearly term</li>
                    <li>Your chats, files and history stay waiting if a trial ends</li>
                  </ul>
                </div>
              </Reveal>
              <Reveal>
                <div className="band">
                  <h2>Ready to lift the workday?</h2>
                  <p>
                    Open Crewlyft, create a company workspace, and invite the team with a code. WorkLyft is
                    here to help you get there.
                  </p>
                  <div className="cta-row">
                    <a className="btn btn-primary" href={APP_URL} target="_blank" rel="noreferrer">
                      Open Crewlyft
                    </a>
                    <a className="btn btn-ghost" href={DEMO_URL} target="_blank" rel="noreferrer">
                      Explore the demo
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <Reveal>
              <div className="section-head">
                <h2>Questions</h2>
                <p>Straight answers before you jump into the app.</p>
              </div>
            </Reveal>
            <div className="faq">
              <Reveal>
                <details open>
                  <summary>What is WorkLyft?</summary>
                  <p>
                    WorkLyft is the home for Crewlyft — the business communication app with chats, people and
                    company news, plus meetings, tasks and the day-to-day tools teams need.
                  </p>
                </details>
              </Reveal>
              <Reveal>
                <details>
                  <summary>Do I need a card for the trial?</summary>
                  <p>No. Try every feature for seven days, then choose a monthly or yearly plan.</p>
                </details>
              </Reveal>
              <Reveal>
                <details>
                  <summary>Who is Crewlyft for?</summary>
                  <p>
                    Businesses that want one place for internal teams and external clients — from operations
                    chats to investor updates and site visits.
                  </p>
                </details>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-row">
          <div>
            <strong style={{ color: "var(--ink)" }}>WorkLyft</strong>
            <div>Marketing home for Crewlyft · Operated with AnodeH</div>
          </div>
          <div className="footer-links">
            <a href={APP_URL} target="_blank" rel="noreferrer">
              Open app
            </a>
            <a href={DEMO_URL} target="_blank" rel="noreferrer">
              Demo
            </a>
            <a href={`${APP_URL}/privacy`} target="_blank" rel="noreferrer">
              Privacy
            </a>
            <a href="mailto:support@anodeh.com">support@anodeh.com</a>
          </div>
        </div>
      </footer>
    </>
  );
}
