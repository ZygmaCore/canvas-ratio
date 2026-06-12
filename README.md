# Canvas Ratio

A local-first visual time allocation app based on canvas, colors, and ratios.

Canvas Ratio treats each day like a canvas. White space is free time, black space is blocked time, and colored space belongs to intentional work.

The root page introduces the product, links to Canvas and Project Files, and keeps detailed usage notes out of the first view.

## Core Concept

- White = free time.
- Black = blocked time that cannot be used.
- Colors = user-defined projects and their tasks.
- Projects are global settings that can be added, edited, reordered, colored, and archived.
- Ratios apply only to the non-black canvas.
- Each day has 48 visible cells.
- Each cell is 30 minutes.
- Internally, the app stores 1440 minute slots for accurate rebuilds.

Fresh installs start with no projects. Users create their own project list before painting the canvas. Black cells are excluded first, then recommended project cells are calculated from the remaining paintable cells using largest-remainder rounding. If active ratios do not total 100, recommendations are normalized internally.

When a random event is added, its time range becomes black and colored task cells after the event end are cleared back to free time. Existing black blocks are preserved, and colored cells before the interruption still count against the recalculated recommendation.

## Features

- Date-based daily canvas.
- Today is editable.
- Past dates are read-only.
- Future dates are not editable.
- A.M. and P.M. cell canvases.
- Project ratios as soft recommendations.
- Project/task separation.
- Project Files for long-term block-based progress.
- Task Dump side panel for listing unplanned tasks, copying a planning prompt, and applying pasted AI JSON back to free blocks.
- Sleep and random events as black canvas.
- Random events replan the remaining day by clearing colored task assignments after the event end.
- Sleep blocks and existing random-event blocks stay black during replans.
- Deleting black blocks restores covered colors when assignments still exist.
- Automatic clock-based Pomodoro 25/5 rhythm.
- Local JSON export/import backup tools.
- Daily Review prompt builder that copies a local, structured day summary.

## Task Dump

Task Dump lives in the Canvas page side panel on desktop and the Dump tab on mobile. It helps plan remaining white/free blocks without sending data anywhere automatically.

- It asks only for task name, optional note, and block count.
- It does not ask for a project.
- One block equals one 30-minute free canvas cell.
- Total dumped task blocks cannot exceed current white/free blocks.
- If black time changes and the dump exceeds current free blocks, the dump is preserved and copy/apply are disabled until the user reduces it or frees canvas blocks.
- Copy Planning Prompt copies a compact 48-block JSON prompt to the clipboard.
- The prompt can be pasted into ChatGPT, Gemini, Claude, or another external chatbot. The external AI chooses a `projectId` from the current active projects array.
- Paste AI Result accepts pure JSON, markdown-wrapped JSON, or longer answers containing a JSON assignment.
- Apply to Canvas validates the pasted assignment against the current free blocks before coloring anything.
- Valid pasted assignments become project-colored Task Dump scheduled cells and count toward that project’s recommendation usage.
- Canvas Ratio does not call an AI API.
- No data leaves the browser unless the user pastes it somewhere else.

## Project Files

Project Files live at `/project-files` and track long-term work as completion blocks. Each block is one unit of progress.

For every Project File, Canvas Ratio stores:

- project name
- unit name
- total target
- target date
- optional notes
- completed/uncompleted blocks

The app calculates days left inclusively from the current local date, today’s required work, completed-today count, remaining units, and target-date-passed warnings in the browser. Project Files are local-first and stored in localStorage:

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

Day records no longer require per-day projects. Older records with embedded projects can still load, and legacy starter-project IDs are preserved when possible.

Day records may also include:

- `taskDump`: local Task Dump items for the selected day.
- `tasks[].source`: `project-paint` for normal colored project cells or `task-dump` for pasted Task Dump scheduled cells.

The Backup & Settings panel can:

- export the current day as `canvas-ratio-{date}.json`
- export all Canvas Ratio records as `canvas-ratio-backup-{YYYY-MM-DD}.json`
- import a single day JSON
- import a full backup JSON

Imports and exports are client-side only. No server upload, database, account, or cloud sync is used.

## Daily Review Prompt

The Today’s Review button copies a Daily Review prompt to your clipboard. The prompt is built in the browser from the current day’s 48 half-hour blocks, project ratios, tasks, black time, and Task Dump scheduled cells when they exist.

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
- Local Task Dump planning prompt copy and pasted JSON apply.
- JSON backup/import.
- Production Docker build.
