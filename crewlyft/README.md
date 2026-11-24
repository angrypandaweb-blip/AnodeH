# CrewLyft marketing site

Static landing page for **crewlyft.com** — product story, sample screens, and mobile download CTAs that open the live CrewLyft app.

Official brand files live in `brand/` (icon + CREWLYFT BUSINESS CHAT lockup).

## Local preview

```bash
cd crewlyft
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173

## Deploy to crewlyft.com

The live product app currently sits on Firebase (`workbridge-app-1979.web.app`). Point the `crewlyft.com` custom domain at this marketing site (or host this folder on any static host), then keep the app on a path or subdomain such as `app.crewlyft.com`.

### Firebase Hosting (same project)

From this folder:

```bash
firebase use workbridge-app-1979
firebase deploy --only hosting
```

Then in Firebase Console → Hosting → add custom domain `crewlyft.com` and complete DNS.

### Any static host

Upload the contents of this folder (`index.html`, `styles.css`, `script.js`, `brand/`) to the web root for `crewlyft.com`.

## Download buttons

- **Download for phone** → Google share / installable web app
- **Open in browser** → `https://workbridge-app-1979.web.app/`

Update those URLs in `index.html` if store listings or a production app domain change.
