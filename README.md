# Canvas Ratio

A local-first visual time allocation app based on canvas, colors, and ratios.

Canvas Ratio treats each day like a drawing book. White space is free time, black space is unavailable time, and colored space belongs to projects and tasks.

## Core Concept

- White = free time.
- Black = unavailable time.
- Colors = projects and tasks.
- Ratios apply only to the non-black canvas.
- Each day has 48 visible cells.
- Each cell is 30 minutes.
- Internally, the app stores 1440 minute slots for accurate rebuilds.

Project ratios must total exactly 100 before painting. Black cells are excluded first, then project quotas are calculated from the remaining paintable cells using largest-remainder rounding.

## Features

- Date-based daily canvas.
- Today is editable.
- Past dates are read-only.
- Future dates are unavailable.
- A.M. and P.M. cell canvases.
- Project ratios and quota-based painting.
- Project/task separation.
- Sleep and random events as black canvas.
- Black blocks override colored cells without deleting task assignments.
- Deleting black blocks restores covered colors when assignments still exist.
- Automatic clock-based Pomodoro 25/5 rhythm.
- Local JSON export/import backup tools.
- Optional AI journal and 100x100 pixel story with mock fallback.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Browser localStorage
- Docker production build

## Storage And Backup

Canvas Ratio stores one `DayRecord` per date in browser localStorage:

```text
canvas-ratio:v1:{YYYY-MM-DD}
```

The Backup Tools panel can:

- export the current day as `canvas-ratio-{date}.json`
- export all Canvas Ratio records as `canvas-ratio-backup-{YYYY-MM-DD}.json`
- import a single day JSON
- import a full backup JSON

Imports and exports are client-side only. No server upload, database, account, or cloud sync is used.

## Environment Variables

AI is optional. Without `GEMINI_API_KEY`, the app uses mock fallback output.

```text
GEMINI_API_KEY=your_key_here
GEMINI_TEXT_MODEL=gemini-3.1-flash-lite
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

`GEMINI_API_KEY` is read server-side by the API routes and should not be exposed with a `NEXT_PUBLIC_` prefix.

## Run Locally

Install dependencies:

```bash
npm install
```

Build the production app:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Open [http://localhost:3000](http://localhost:3000).

## Run With Docker

Build the image:

```bash
docker build -t canvas-ratio .
```

Run with Docker Compose:

```bash
docker compose up --build -d
```

Stop the container:

```bash
docker compose down
```

The Docker setup runs the standalone Next.js production server with `node server.js`. It does not use bind mounts and does not run the development server.

## Known Limitations

- Storage is localStorage only.
- There is no login, account sync, database, or cloud sync.
- Clearing browser data can delete records.
- Export/import backup is recommended before clearing browser data or changing browsers.
- AI is optional and depends on Gemini environment variables.
- Image generation falls back to a deterministic mock if AI is unavailable.
- There are no analytics, social sharing, billing, teams, calendar integration, dashboard charts, or push notifications.

## Release Notes

### v1.0 MVP / 10-day build

- Local-first 48-cell daily canvas.
- Project-ratio quota painting.
- Sleep and random-event black canvas.
- Automatic Pomodoro.
- Optional AI journal and pixel story.
- JSON backup/import.
- Production Docker build.
