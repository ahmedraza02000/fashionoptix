# Putting FashionOptix online

I can't deploy this myself — it needs an account on a hosting provider,
which only you can create. This is the concrete path to do it.

You're deploying two separate things: the **backend** (Python, needs a
server that stays running) and the **frontend** (static files, can go
almost anywhere). They need to be deployed separately and then pointed at
each other.

## 1. Deploy the backend

**Render.com** — `backend/render.yaml` is already set up for this.
1. Push the `fashionoptix` folder to a GitHub repo.
2. On Render: New → Blueprint → connect your repo. Render reads
   `backend/render.yaml` automatically and configures the service
   (root dir, build command, start command) for you.
   - If you'd rather configure it by hand instead: New → Web Service →
     root directory `backend`, build command blank, start command
     `python app.py`.
3. Render assigns a URL like `https://fashionoptix-backend.onrender.com`.

`backend/requirements.txt` is intentionally empty (stdlib only) but its
presence helps Render auto-detect this as a Python project.

One real constraint: `backend/app.py` currently listens on port `8000`
and SQLite's file (`fashionoptix.db`) lives on local disk, which most
free hosts **reset on every redeploy** — your data won't persist long-term
on a free tier. Two fixes, pick based on effort you want to spend:
- **Quick/acceptable for a demo:** do nothing — it reseeds automatically
  on boot. Fine for a viva, not fine for real users.
- **Proper fix:** change `DB_PATH` in `backend/app.py` to point at a
  persistent disk (Render's paid "Persistent Disk" add-on), or migrate to
  a hosted Postgres database — a bigger change I can help you make if you
  want to go this route.

## 2. Deploy the frontend

**Vercel** — `vercel.json` is already in the repo root (build command,
output directory, and the SPA rewrite rule React Router needs so refreshing
`/search` or `/dashboard` doesn't 404).
1. Same GitHub repo, import it in Vercel with root directory `/` (not `backend`).
2. It reads `vercel.json` automatically.
3. Set the environment variable `VITE_API_BASE` to your Render backend URL
   plus `/api`, e.g. `https://fashionoptix-backend.onrender.com/api`.
4. Deploy — you get a URL like `https://fashionoptix.vercel.app`.

**Netlify** is also pre-configured via `netlify.toml` at the repo root, if
you'd rather use that instead — same steps, different dashboard.

## 3. Connect them
Once both are live, open the frontend URL. It will call the backend URL
you set in `VITE_API_BASE` instead of `localhost:8000`. Test signup/login
and the wishlist to confirm the two are actually talking to each other.

## What I'd need from you to go further
If you want me to actually prepare the repo for one of these platforms
(add a `render.yaml`, fix the port handling, move to Postgres for real
persistence), tell me which host you're using and I'll make those exact
changes.
