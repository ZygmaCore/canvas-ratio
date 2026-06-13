# Canvas Ratio

Canvas Ratio is a local-first visual time architecture app for planning a day with blocks, colors, and flexible ratios.

It treats each day as a canvas:

* **White** blocks are free time.
* **Black** blocks are time that cannot be used.
* **Colored** blocks belong to user-defined projects.

Canvas Ratio is built around a simple idea: your day should be visible, adjustable, and easy to repaint when reality changes.

## Overview

Canvas Ratio helps users:

* create their own projects
* set soft ratio recommendations
* paint a 48-block daily canvas
* mark blocked time as black
* replan remaining free blocks
* copy structured prompts for external AI tools
* track long-term progress with Project Files

The app is local-first. It does not require login, cloud sync, analytics, or an AI API.

## Core Concept

Each day contains **48 visible blocks**.

Each block represents **30 minutes**.

Internally, Canvas Ratio stores **1440 minute slots** so the canvas can be rebuilt accurately when black blocks, colored blocks, or task assignments change.

Canvas states:

| State   | Meaning                             |
| ------- | ----------------------------------- |
| White   | Free time that can still be planned |
| Black   | Blocked time that cannot be used    |
| Colored | Planned time assigned to a project  |

Projects are user-defined. Fresh installs start with an empty project list, so each user creates their own system from scratch.

Ratios are **recommendations**, not limits. A user can paint beyond a recommendation if the day requires it.

## Project System

Projects are global settings stored locally.

A project can have:

* name
* ratio
* color
* order
* archived status

Users can create their own projects, such as work areas, study areas, hobbies, routines, or any custom category.

Fresh installs do not include preset projects.

If no projects exist, painting is disabled until the user creates a project.

## Ratio Recommendations

Project ratios apply only to the non-black canvas.

```text
paintableBlocks = 48 - blackBlocks
```

Recommendations are calculated from the remaining paintable blocks.

If active ratios do not total 100, Canvas Ratio normalizes them internally for recommendation math.

Example:

```text
Project A: 40
Project B: 20
Project C: 20
Total ratio: 80
```

Canvas Ratio treats this as:

```text
Project A: 50%
Project B: 25%
Project C: 25%
```

Ratios do not block painting. They only show whether a project is under, on, or over its recommendation.

## Black Blocks

Black blocks represent time that cannot be used.

Examples:

* sleep
* fixed commitments
* sudden events
* travel
* interruptions
* unavailable time

When a random event is added:

1. The event range becomes black.
2. Colored task cells after the event end can be cleared back to free time.
3. Existing black blocks stay black.
4. Colored cells before the interruption still count toward the recalculated recommendation.

This makes the canvas dynamic instead of forcing the user to preserve an outdated plan.

## Canvas Page

The Canvas page is the main workspace.

It includes:

* date controls
* daily status chips
* A.M. and P.M. canvas blocks
* project selector
* ratio recommendation status
* black block controls
* Task Dump side panel
* review actions
* optional backup tools

The Canvas page is designed to stay simple. Detailed explanations belong on the welcome page or README, not inside the daily workspace.

## Task Dump

Task Dump helps users plan remaining free blocks with an external AI tool.

It lives in the right side panel on desktop and in the Dump tab on mobile.

Task Dump asks for:

* task name
* optional note
* block count

It does **not** ask for a project.

The external AI chooses the project by reading the task name, note, and the current project list.

### Block Count

In Task Dump, `blockCount` is a flexible time quota.

A task with multiple blocks does not need to be scheduled consecutively.

Example:

```text
Study pointers
blockCount: 3
```

The AI may schedule it into any three valid free blocks, such as:

```text
09:00-09:30
11:00-11:30
15:30-16:00
```

The only strict rule is that the total assigned blocks must match the task’s `blockCount`.

## Task Dump AI Workflow

Canvas Ratio does not call an AI API.

The workflow is manual:

1. User writes tasks in Task Dump.
2. User clicks **Copy Planning Prompt**.
3. User pastes the prompt into an external AI chatbot.
4. The AI returns a JSON assignment.
5. User pastes the JSON back into Canvas Ratio.
6. Canvas Ratio validates the JSON.
7. Valid assignments are applied to free white blocks.

The AI must:

* use only tasks from the Task Dump
* use only free block indexes
* avoid black blocks
* avoid already colored blocks
* respect each task’s block count exactly
* assign each scheduled block to one existing project
* choose project IDs from the current projects array
* never invent project IDs

## Applying AI JSON

Canvas Ratio accepts:

* pure JSON
* markdown-wrapped JSON
* longer AI responses containing a JSON assignment

Each assignment must include:

```json
{
  "blockIndex": 18,
  "startTime": "09:00",
  "endTime": "09:30",
  "taskName": "Example task",
  "note": "Optional note",
  "projectId": "existing-project-id"
}
```

Before applying, Canvas Ratio validates that:

* the block index exists
* the block is currently white/free
* the block is not black
* the block is not already colored
* the task exists in Task Dump
* the project ID exists in the current project list
* the assigned block count matches the task’s required block count
* no block is assigned twice

Valid assignments become colored project blocks and count toward that project’s recommendation usage.

## Project Files

Project Files live at:

```text
/project-files
```

They track long-term progress as completion blocks.

A Project File can represent:

* a course
* a book
* a music repertoire
* a project
* a habit
* any measurable long-term target

Each Project File stores:

* project file name
* linked Canvas project
* unit name
* total target
* target date
* optional notes
* completion blocks

Project Files can be linked to a Canvas project. When linked, the Project File uses the Canvas project’s color and can be filtered by project.

If a linked project is deleted or archived, the Project File remains readable and can appear as unlinked.

## Required Today

Project Files calculate daily progress requirements from the actual current local date.

The calculation updates as progress changes.

Definitions:

```text
completedToday = blocks completed today
remainingTotal = totalTarget - completedBlocks
daysLeftInclusive = days from today to target date, including today
todayTargetBase = ceil(remainingAtStartOfToday / daysLeftInclusive)
requiredToday = max(0, todayTargetBase - completedToday)
```

Behavior:

* Checking progress today reduces Required Today.
* Completing today’s target sets Required Today to 0.
* Tomorrow, Required Today recalculates from remaining progress and remaining days.
* If the user does not finish enough today, tomorrow’s requirement increases naturally.
* If the project is complete, Required Today becomes 0.
* If the target date has passed, remaining work is shown as due.

## Project File Export And Import

Project Files can export standalone HTML files.

The exported HTML includes embedded JSON:

```html
<script type="application/json" id="canvas-ratio-project-file">
```

Import reads that embedded JSON and restores the Project File into localStorage.

If the imported file references a project that does not exist in the current project list, the file is imported as unlinked.

Canvas Ratio does not create projects automatically during import.

## Daily Review Prompt

The Daily Review button copies a structured review prompt to the clipboard.

The prompt is built locally from:

* the 48 canvas blocks
* project list
* ratio recommendations
* colored tasks
* black blocks
* Task Dump scheduled cells

Canvas Ratio does not call an AI API when generating the review prompt.

The user decides where to paste it.

## Local-First Storage

Canvas Ratio stores data in browser localStorage.

Daily records use:

```text
canvas-ratio:v1:{YYYY-MM-DD}
```

Global settings use:

```text
canvas-ratio:settings
```

Project Files use:

```text
canvas-ratio:project-files:v1
```

Data stays in the browser unless the user exports it or pastes copied prompts somewhere else.

## Backup And Import

Backup tools are client-side only.

They can export:

* the current day
* all Canvas Ratio records
* Project Files

They can import:

* a single day JSON
* a full backup JSON
* exported Project File HTML

There is no server upload, database, or account sync.

## Tech Stack

* Next.js App Router
* TypeScript
* Tailwind CSS
* Browser localStorage
* Docker production build

## Environment Variables

No environment variables are required.

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

Open:

```text
http://localhost:3000
```

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

The Docker setup runs the standalone Next.js production server with:

```bash
node server.js
```

It does not use bind mounts and does not run the development server.

## Known Limitations

* Storage is localStorage only.
* There is no login.
* There is no account sync.
* There is no database.
* There is no cloud sync.
* Clearing browser data can delete records.
* Export/import backup is recommended before clearing browser data or switching browsers.
* There are no analytics, billing, teams, calendar integration, social sharing, dashboard charts, or push notifications.

## Release Notes

### v1.0 MVP

* Local-first daily canvas.
* 48 visible 30-minute blocks.
* 1440-minute internal slot rebuild system.
* User-defined projects.
* Soft ratio recommendations.
* White, black, and colored canvas states.
* Paint/unpaint cell interaction.
* Black block planning.
* Random-event replanning.
* Task Dump prompt copy.
* External AI JSON paste and validation.
* Split Task Dump scheduling.
* Daily Review prompt copy.
* Project Files for long-term progress.
* Project Files linked to Canvas projects.
* Project File HTML export/import.
* Local backup/import.
* Docker production build.
