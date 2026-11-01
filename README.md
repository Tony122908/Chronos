# CHRONOS — Infinite Timeline

CHRONOS is a frontend-only planning workspace built around one spatial timeline. Years, months, ISO weeks, days, and task bars share the same UTC coordinate system. The Organized Timeline is the permanent interface and Rapid Folio Flip is the fixed discrete zoom transition.

## Install and run

```bash
pnpm install
pnpm run dev
```

Open <http://127.0.0.1:5173>. The port is fixed so browser-stored tasks remain available at the same origin.

```bash
pnpm test
pnpm run build
```

## Navigation

- Click a year, month, or week to enter the next complete level.
- Click any parent band or the breadcrumb beneath **CHRONOS** to jump directly back to that complete level.
- Breadcrumb and contextual date controls activate only by click, tap, `Enter`, or `Space`; pointing never changes the timeline.
- Drag, swipe, or scroll to move through time.
- Pinch, modifier-scroll, or use `+` / `−` to zoom.
- `←` / `→` pan, `+` / `−` zoom, and `T` returns to today.
- The contextual control displays a date only—never a clock.
- The Years level intentionally omits the old month preview grid.

Rapid Folio Flip retains only the outgoing complete level above the incoming complete level. It works forward and backward, supports direct multi-level jumps, preserves the anchor, and becomes a minimal fade under reduced motion.

## Tasks and persistence

Create tasks with **New Task** and provide a title, optional project, exact start/end dates, importance, urgency, and notes. Task bars use the same `timeToX` projection as the timeline. They can be edited, deleted, moved, resized, reordered, and filtered without changing their underlying UTC dates.

## Projects

- Choose a project directly below **Title** in the New/Edit Task dialog, or create one in place.
- Use the compact **All Projects** control above the task bars to filter by one or several projects.
- The filter shows task counts and supports Clear, Show All, Show More, rename, and explicit two-step deletion.
- Choose from eight restrained project colors when creating a project, and change its name or color later with **Edit**. Task and filter markers update immediately.
- The filter uses a brief fade, lift, and scale transition; Show More/Show Less resizes smoothly, while reduced-motion mode removes spatial movement.
- Deleting a project never deletes its tasks; those tasks return to **No Project**.
- Existing tasks are migrated safely to **No Project**.

Tasks are stored directly in this browser under the existing `chronos-tasks` localStorage key. Projects use the versioned `chronos-projects-v1` key. Both remain after refresh. CHRONOS does not require an account, backend, database, or network connection, and existing task storage remains compatible.

## Architecture

```text
src/
├── back/
│   ├── engine/        pure coordinate and zoom calculations
│   └── lib/           UTC Gregorian/ISO calendar, task, and project models
└── front/
    ├── components/    organized timeline, controls, and tasks
    ├── hooks/         timeline, gestures, and local task/project state
    └── styles/        shared light/dark responsive visual system
```

The coordinate engine is independent of task storage and presentation. Future milestone, note, photograph, or project layers can reuse the same projection without changing timeline navigation.

## Date model

CHRONOS uses UTC milliseconds for the continuous coordinate space and constructs civil boundaries in UTC. Months retain exact lengths, leap years follow the Gregorian calendar, and weeks follow ISO 8601 beginning Monday. The supported range is years 1–9999. The current-date guide is derived from the user's wall-clock date, but no time of day is displayed.

## Appearance and accessibility

The initial theme follows the system and can be overridden. Controls have accessible names and focus states, the timeline has a screen-reader description, keyboard navigation is complete, touch gestures are supported, and reduced-motion preferences replace the Folio transition with a minimal fade.

## Known limitations

- Tasks are local to this browser and do not sync across devices.
- Clearing browser storage removes saved tasks.
- Week numbers use ISO 8601 even when the user's locale uses another convention.
- Days are the closest temporal level; hours are intentionally not rendered.

