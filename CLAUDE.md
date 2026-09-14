# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

New Train Tracker shows new MBTA rolling stock (Orange/Red CRRC, Green Type-9, Silver BEB) moving along a stylized SVG line map in near-real time. React + TypeScript + Vite frontend (`src/`), Python 3.13 AWS Chalice backend (`server/`) that proxies and enriches the MBTA V3 API.

## Commands

Requires Python 3.13 + [uv](https://docs.astral.sh/uv/) and Node 22 / npm 10.

```bash
npm install          # also runs `uv sync` and installs pre-commit hooks (postinstall)
npm start            # concurrently: vite dev server :5173 + `chalice local` :5555
npm run build        # tsc && vite build -> dist/
npm run lint         # eslint + tsc --noEmit, then ruff over server/
npm run lint-frontend
npm run lint-backend
npm run test-frontend        # jest
npx jest src/components/LineStats/__tests__/LineStatsTable.test.tsx   # single file
npx jest -t 'partial test name'                                      # single test
```

Set `MBTA_V3_API_KEY` in the environment for higher MBTA API rate limits (the `/healthcheck` route fails without it). There are no backend tests.

Test files are deliberately excluded from both `tsconfig.json` and `.eslintrc.js` — lint/typecheck will not cover them, so type errors in tests only surface when jest runs (`ts-jest` compiles them).

## Architecture

### Frontend ↔ backend wiring

There is no Vite proxy. `src/constants.ts` maps `window.location.hostname` to a backend base URL (`localhost` → `http://localhost:5555`, beta and prod → their API Gateway domains). Any new deployment hostname must be added there.

Data fetching lives in `src/hooks/useMbtaApi.ts` (TanStack Query): stops/routes are cached for a day, train positions poll every 15s. `src/hooks/useLastSighting.ts` fetches `/last_seen.json` directly from the frontend's own S3 origin, not from the API.

UI state (selected line, vehicle category) lives in URL search params via `src/hooks/searchParams.ts` — that's the source of truth, not React state.

### The SVG map pipeline

This is the least obvious part of the codebase and spans four files:

1. `src/paths.ts` — a turtle-graphics DSL. `start(x, y, theta)`, `line(len)`, `curve(len, angle)`, `wiggle(len, width, angle)` each take a turtle and return a segment with an SVG path fragment, an end turtle, a length, and a `get(fraction)` position function (béziers via `bezier-js`). `stationRange({start, end, commands})` declares that a run of commands covers the stations between two `place-*` IDs.
2. `src/lines.ts` — declarative shape of every line/branch built from that DSL (`greenLine`, `redLine` with derived `Red-A`/`Red-B` routes, `orangeLine`, `blueLine`, `mattapanLine`). Layout changes (e.g. a new station or branch) happen here.
3. `src/prerender.ts` — `prerenderLine()` walks the shapes, concatenates the SVG path directive, computes a length→turtle `pathInterpolator`, and distributes the stations of each `stationRange` evenly along its measured length to produce `stationPositions`.
4. `src/components/Line.tsx` — renders the path, stations and trains; `src/interpolation.ts` turns a train's lat/long into an offset between its previous and next station (falling back to the nearest station when a train leaves its route, e.g. a Green-B turning at Park). `src/labels.tsx` and `TrainDisplay.tsx`/`TrainPopover.tsx` handle train labels and detail popovers.

### Backend

`server/app.py` holds all Chalice routes — `/trains/{route_ids}`, `/stops/{route_id}`, `/routes/{route_ids}`, `/predictions/{trip_id}/{stop_id}`, `/healthcheck` — each returning an explicit `Cache-Control` header (5s for trains, 7 days for stops/routes); those headers are the cost-control mechanism for API Gateway and should be preserved. A `@app.schedule(Cron(...))` job runs `last_seen.update_recent_sightings()` every 10 minutes.

`server/chalicelib/`:
- `mbta_api.py` — async `aiohttp` wrapper over the MBTA V3 API with an in-memory TTL cache plus a never-expiring stale cache used as a fallback for stations/routes. Flattens JSON:API responses (`json_api_doc`) into the `Train` shape consumed by the frontend, and holds `CARRIAGE_AGES` (car-number range → build years shown in the popover).
- `routes.py` — the custom-route abstraction. `Red-A`/`Red-B` (Ashmont/Braintree) are **not** real MBTA route IDs; they're derived per-vehicle from route patterns/stops and normalized back to `Red` before hitting the API. Green branches and Silver Line route IDs live here too.
- `fleet.py` — the definition of "new": car-number range predicates per route. Adding a new fleet means editing the range here, `CARRIAGE_AGES` in `mbta_api.py`, and the counts in `src/static_data.json` (read by `LineStats`).
- `last_seen.py` / `s3.py` — the scheduled job reads/writes `last_seen.json` in the S3 bucket named by `TM_CORS_HOST` (i.e. the frontend bucket), which is why the frontend can fetch it as a static file.

Pride and holiday cars are configured by the `PRIDE_TRAIN_CARS` / `HOLIDAY_TRAIN_CARS` comma-separated env vars in `server/.chalice/config.json`, surfaced as `isPrideCar` / `isHolidayCar` and filterable in the UI.

## Deployment

`./deploy.sh` (add `-p` for production, `-c` in CI) builds the frontend, exports `requirements.txt` from uv, runs `chalice package --merge-template server/cloudformation.json`, deploys the CloudFormation stack, syncs `dist/` to the frontend S3 bucket and invalidates CloudFront. Backend/frontend hostnames are set in both `deploy.sh` and `server/.chalice/config.json` and must stay in sync. Pushing to `main` deploys to production via GitHub Actions. The footer version string comes from `GIT_ABR_VERSION` (a git tag) injected by Vite's `define`.

## Conventions

- Frontend: Prettier — 4-space indent, single quotes, 100 cols, es5 trailing commas. `no-console` is an error; `import/no-default-export` and `@typescript-eslint/no-explicit-any` are warnings. TS is strict with `noUnusedLocals`/`noUnusedParameters`.
- Backend: ruff, 120 cols, double quotes, target py313 (`E731` ignored — lambda assignments are used intentionally in `fleet.py`). Pre-commit runs `ruff --fix` and `ruff-format` on Python.
- CI checks that `package-lock.json` is up to date (`package-lock-utd`); commit lockfile changes alongside `package.json`.

## Commit attribution

Any commit containing work by Claude must carry co-author attribution in its commit message. End the message with a trailer naming the model that contributed, e.g.:

```
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

Pull request descriptions for that work should likewise note they were generated with [Claude Code](https://claude.com/claude-code).
