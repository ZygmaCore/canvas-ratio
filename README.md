# Canvas Ratio

A local-first visual time allocation app based on canvas, colors, and ratios.

Canvas Ratio treats each day like a drawing book. Free space is open time, unavailable space is blocked time, and colored space belongs to projects and tasks.

## Core Concept

- White = free time.
- Black = unavailable time.
- Colors = the fixed global projects and their tasks.
- Projects are global settings: School, Work, and Personal.
- Ratios apply only to the non-black canvas.
- Each day has 48 visible cells.
- Each cell is 30 minutes.
- Internally, the app stores 1440 minute slots for accurate rebuilds.

The default project ratios are School 50, Work 30, and Personal 20. Users adjust those global ratios as recommendations for a balanced day. Black cells are excluded first, then recommended project cells are calculated from the remaining paintable cells using largest-remainder rounding.

When a random event is added, its time range becomes black and colored task cells after the event end are cleared back to free time. Existing black blocks are preserved, and colored cells before the interruption still count against the recalculated recommendation.

## Features

- Date-based daily canvas.
- Today is editable.
- Past dates are read-only.
- Future dates are unavailable.
- A.M. and P.M. cell canvases.
- Project ratios as soft recommendations.
- Project/task separation.
- Project Files for long-term block-based progress.
- Sleep and random events as black canvas.
- Random events replan the remaining day by clearing colored task assignments after the event end.
- Sleep blocks and existing random-event blocks stay black during replans.
- Deleting black blocks restores covered colors when assignments still exist.
- Automatic clock-based Pomodoro 25/5 rhythm.
- Local JSON export/import backup tools.
- Daily Review prompt builder that copies a local, structured day summary.

## Project Files

Project Files live at `/project-files` and track long-term work as completion blocks. Each block is one unit, such as one video, lesson, chapter, or task.

For every Project File, Canvas Ratio stores:

- project name
- unit name
- total target
- today date
- target date
- optional notes
- completed/uncompleted blocks

The app calculates days left inclusively, today’s required work, completed-today count, remaining units, and target-date-passed warnings in the browser. Project Files are local-first and stored in localStorage:

```text
canvas-ratio:project-files:v1
```

Project Files can export a standalone HTML file. The HTML includes an embedded JSON script tag:

```html
<script type="application/json" id="canvas-ratio-project-file">
```

Import reads that embedded JSON back into localStorage. The Project Review button copies a local prompt to the clipboard only; Canvas Ratio does not call an API.

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

Global project settings are stored separately:

```text
canvas-ratio:settings
```

Day records no longer require per-day projects. Older records with embedded projects can still load, and legacy project names are normalized to the fixed global project IDs when possible.

The Backup & Settings panel can:

- export the current day as `canvas-ratio-{date}.json`
- export all Canvas Ratio records as `canvas-ratio-backup-{YYYY-MM-DD}.json`
- import a single day JSON
- import a full backup JSON

Imports and exports are client-side only. No server upload, database, account, or cloud sync is used.

## Daily Review Prompt

The Today’s Review tab includes a button that copies a Daily Review prompt to your clipboard. The prompt is built in the browser from the current day’s 48 half-hour blocks, project ratios, tasks, and unavailable time.

No API call is made by Canvas Ratio when copying the prompt. You choose where to paste it, and the app keeps the review data local unless you send it somewhere yourself.

## Environment Variables

No environment variables are required for the local MVP.

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
- There are no analytics, social sharing, billing, teams, calendar integration, dashboard charts, or push notifications.

## Release Notes

### v1.0 MVP / 10-day build

- Local-first 48-cell daily canvas.
- Project-ratio recommendation painting.
- Sleep and random-event black canvas.
- Automatic Pomodoro.
- Local Daily Review prompt copy.
- JSON backup/import.
- Production Docker build.
