# Canvas Ratio

Canvas Ratio is a visual time-allocation journaling app. Life is treated like a drawing book: each day has Canvas A.M. and Canvas P.M. for seeing how time is free, unavailable, or assigned to projects.

## MVP scope

- Next.js App Router project with TypeScript and Tailwind CSS.
- Landing/tutorial page at `/`.
- Day canvas skeleton at `/canvas`.
- Fixed 12-color palette constants.
- Initial Canvas Ratio TypeScript types.
- Time utility functions for minute and date handling.
- Day 2 per-date `DayRecord` storage with localStorage.
- Date selector with today, past, and future states.
- Real A.M. and P.M. SVG canvas renderers built from minute slots.
- Contiguous slot grouping for efficient canvas segment rendering.
- Sleep and random event inputs that paint unavailable time black.
- Task/project coloring with duration, ratio, and exact time-range assignment.
- Unified slot rebuilds so black canvas can cover assigned task colors without losing them.
- Separate project ratio input and task painting from project selection.
- Interactive 48-cell canvas where each user-facing cell is 30 minutes.
- Automatic clock-based 25/5 Pomodoro panel.
- Finish Coloring panel that writes a saved daily journal from a compact day snapshot.
- `/api/journal` route with Gemini support and a deterministic mock fallback.
- Temporary Day 7 debug panel for verifying stored records, renderer output, quota totals, cells, black block totals, task coverage, and journal state.
- Standard Next.js, Docker, and env-focused `.gitignore`.
- Production Dockerfile and Docker Compose runtime.

Day 7 intentionally does not include login, signup, database storage, AI edits to user data, ratio recommendations, drag/drop editing, custom colors, image generation, pixel story mode, analytics, or dev Docker mode.

## Day 2 localStorage

Each date has its own `DayRecord` in browser localStorage. The storage key format is:

```text
canvas-ratio:v1:{YYYY-MM-DD}
```

Example:

```text
canvas-ratio:v1:2026-06-02
```

The settings key is reserved for later:

```text
canvas-ratio:settings
```

Day behavior:

- Today is editable unless the day record is locked.
- Past dates are viewable and read-only.
- Future dates are unavailable and do not create a localStorage record.
- Empty day records contain exactly 1440 white minute slots.

On `/canvas`, use the date selector to switch between dates. The Reset Today button only appears for editable today and resets today’s record back to 1440 white slots after confirmation.

## Day 3 renderer

Canvas A.M. and Canvas P.M. are rendered from the `DayRecord.slots` array:

- Canvas A.M. renders minutes `0-719`, or `00:00-11:59`.
- Canvas P.M. renders minutes `720-1439`, or `12:00-23:59`.
- Each canvas has 720 minute slots mapped to 360 degrees.
- Rendering starts at the top of the circle like a clock.
- Contiguous slots with the same color, state, task id, and block id are grouped into one SVG segment.

Current Day 3 data is still mostly white because sleep input, random events, and task coloring arrive later. The renderer already supports white, black, and colored segments so future coloring logic can update slots without changing the SVG renderer.

## Day 4 black canvas

Sleep and random events can now be added on editable today. Both become black canvas because they represent unavailable time.

- Sleep defaults to `22:00-05:00`.
- Random events use a title plus a time range.
- Overnight ranges are supported, so `23:00-05:00` is treated as `23:00-24:00` plus `00:00-05:00` within the same selected day.
- Black blocks are saved in localStorage as `sleepBlocks` and `randomEventBlocks`.
- The slot array is rebuilt from remaining blocks whenever a block is deleted, so overlapping black blocks stay correct.
- Past dates show the black block list in read-only mode.
- Future dates remain unavailable and do not create records.

Black always has priority over white or colored slots. Task coloring only paints white slots.

## Day 5 task coloring

Tasks can now paint project colors onto editable today. Project colors are limited to `PROJECT_COLORS`; white, black, and custom colors are not available for tasks.

Assignment modes:

- Fixed Duration chooses the first available white minutes in chronological order within the selected target canvas.
- Ratio paints `round(availableWhiteMinutes * ratio / 100)` within the selected target canvas, with a minimum of 1 minute when white time exists.
- Time Range paints the exact selected range only when every requested minute is white.

Each saved task stores stable `assignedMinutes`. The visible color can be lower than the assigned amount when sleep or random events cover it. Slot rebuilds always apply tasks first and black blocks last, so black canvas visually wins. When a black block is deleted, the saved assigned task colors return automatically.

Past dates show task and black block lists read-only. Future dates remain unavailable and do not create records.

## Day 6 ratios, cells, and Pomodoro

Projects and tasks are now separate. Projects own the project name, color, and required ratio. Tasks select a project from the day’s project list instead of manually typing a project name or color.

Project ratios must total `100` before quota-based painting is allowed. White/free canvas and black/unavailable canvas are not projects and never count toward project ratios. Black cells are removed from the paintable canvas first, then project ratios divide the remaining non-black cells.

The user-facing canvas now uses `48` half-hour cells:

- A.M. has 24 cells from `00:00-12:00`.
- P.M. has 24 cells from `12:00-24:00`.
- Each cell maps to 30 underlying minute slots.
- A black minute makes the whole cell unavailable.
- Manual painting stages white cells and saves them as task `assignedMinutes`.

Project quota rounding uses the largest remainder method:

1. Compute `paintableCellCount * project.ratio / 100`.
2. Floor every raw quota.
3. Distribute remaining cells to the largest fractional remainders.
4. Total project quota cells exactly equals the non-black paintable cell count.

Old Day 5 localStorage records are normalized on load. Existing old tasks remain renderable, and old project name/color task data is migrated into deterministic project records when possible.

The Pomodoro panel follows the local clock automatically:

- The first session starts at `00:00`.
- Each session is 30 minutes: 25 focus, 5 break.
- There are 48 sessions per day.
- There are no start or stop buttons.
- Current Active Task comes from the current 30-minute cell.
- Upcoming Queue Preview looks ahead for future painted task cells.
- `Urutan Sesi Hari Ini` shows all 48 sessions and highlights the current one.
- Sound can be enabled manually because browsers block autoplay by default.

## Day 7 Finish Coloring and AI Journal

Finish Coloring writes a daily journal into `DayRecord.journal`. It does not lock the day, and it does not change ratios, projects, tasks, black blocks, or canvas slots.

The journal input is a compact `JournalInputSnapshot`:

- 48-cell totals for black, white/free, and colored cells.
- Project quota cells, painted cells, remaining cells, ratio, name, and color.
- Task progress as assigned cells and effective painted cells.
- Sleep blocks and random event blocks with time ranges and durations.

Raw `1440` minute slots are not sent to the journal API.

The API route is:

```text
POST /api/journal
```

Request:

```text
{ "snapshot": JournalInputSnapshot }
```

Response:

```json
{
  "source": "ai",
  "model": "gemini-3.1-flash-lite",
  "content": "Journal text",
  "summary": "Short summary"
}
```

If `GEMINI_API_KEY` is missing, invalid, or the Gemini call fails, the route returns a mock journal with `source: "mock"` and `model: "mock-journal"` using status `200`. Invalid request bodies return `400`.

Optional environment variables:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_TEXT_MODEL=gemini-3.1-flash-lite
```

The prompt asks the model to write in Indonesian, use a warm and simple tone, avoid invented tasks, and stay within this boundary: AI is a journal writer only. It must not modify the user’s plan, ratios, tasks, or canvas.

Editable today can generate or regenerate a journal. Past dates show saved journals read-only. Future dates remain unavailable and do not create a record or journal flow.

## Run locally

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

## Run with Docker

Build and run the production image directly:

```bash
docker build -t canvas-ratio .
docker run --rm -p 3000:3000 canvas-ratio
```

Or use Docker Compose:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

The Docker setup runs the standalone Next.js production server with `node server.js`. It does not run `next dev`, does not use volume mounts, and does not provide a development Docker mode.
