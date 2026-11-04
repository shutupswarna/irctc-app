# IRCTC Safar – prototype

A static web app: `index.html`, `engine.js`, `rail.json`. No build step.

## Run it

It must be served over HTTP (opening `index.html` directly will not load the timetable).

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## GitHub Codespaces

1. Push these three files to a GitHub repo, then open it in a codespace.
2. In the terminal: `python3 -m http.server 8000`
3. Open the **Ports** tab, right-click port 8000 → **Port Visibility → Public**.
4. Copy the forwarded URL and share it.

## GitHub Pages (always on, recommended)

Repo → Settings → Pages → Deploy from branch → `main` / root. The site appears at
`https://<username>.github.io/<repo>/`.

Note: outside Claude, Saathi uses its built-in Hindi/Hinglish/English assistant (no live AI).
