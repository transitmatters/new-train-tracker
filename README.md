# New Train Tracker
[![lint](https://github.com/transitmatters/new-train-tracker/actions/workflows/lint.yml/badge.svg)](https://github.com/transitmatters/new-train-tracker/actions/workflows/lint.yml)
[![test](https://github.com/transitmatters/new-train-tracker/actions/workflows/test.yml/badge.svg)](https://github.com/transitmatters/new-train-tracker/actions/workflows/test.yml)
[![deploy](https://github.com/transitmatters/new-train-tracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/transitmatters/new-train-tracker/actions/workflows/deploy.yml)

Developed by [TransitMatters Labs](https://transitmatters.org/transitmatters-labs)

Shows new MBTA Orange, Red, and Green Line trains as they come into service.

## Install & Run
Dependencies:
- `python 3.13` and `node 22.x` (with `npm 10.x`)
  - With [mise](https://mise.jdx.dev) installed, run `mise trust && mise install` (versions are pinned in `.nvmrc` / `.python-version`)
- [`uv`](https://docs.astral.sh/uv/)

Run:
- `$ npm install`
- `$ npm start`
- visit [http://localhost:5173/](http://localhost:5173/)

To use an API key, put it as an environment variable `MBTA_V3_API_KEY`

### Container
You can also run the New Train Tracker inside a container using the following `docker build` and `docker run` commands

```bash
docker build -t new-train-tracker -f Containerfile .
docker run --net=host -e MBTA_V3_API_KEY=your_key_here new-train-tracker
```

The app will be available at [http://localhost:5173/](http://localhost:5173/)

### Linting
To lint frontend and backend code, run `$ npm run lint` in the root directory

To lint just frontend code, run `$ npm run lint-frontend`

To lint just backend code, run `$ npm run lint-backend`

### Testing
To run frontend tests, run `$ npm run test-frontend`. There are no backend tests.

Test files are excluded from `tsconfig.json` and `.eslintrc.js`, so type errors in tests only show up when Jest runs.

## Project Structure
```
src/
  paths.ts          # Turtle-graphics DSL (line, curve, wiggle) for drawing line shapes
  lines.ts          # Shape of every line and branch; layout changes (new stations or branches) go here
  prerender.ts      # Turns shapes into an SVG path and evenly spaced station positions
  interpolation.ts  # Places a train between its previous and next station
  components/       # React components (Line.tsx renders a line, its stations, and trains)
  hooks/            # Data fetching (useMbtaApi.ts) and URL search param state
  constants.ts      # Maps the frontend hostname to its backend URL
server/
  app.py            # Chalice routes and the scheduled last-seen job
  chalicelib/       # MBTA V3 API client, custom routes (Red-A/Red-B), fleet definitions, S3 access
  cloudformation.json  # S3 bucket, CloudFront distributions, and DNS merged into the Chalice stack
```

The backend proxies the MBTA V3 API and returns explicit `Cache-Control` headers. A CloudFront distribution in front of the API caches those responses, so every client polling `/trains` is served by one Lambda invocation. Real-time responses are cached only as long as the backend's in-memory MBTA cache entry is valid, so the edge never serves staler data than the Lambda would. A scheduled job writes `last_seen.json` to the frontend's S3 bucket every 10 minutes, and the frontend fetches it as a static file.

`Red-A` and `Red-B` (Ashmont and Braintree) aren't real MBTA route IDs; `server/chalicelib/routes.py` derives them per vehicle and maps them back to `Red` for API calls. To add a new fleet, update the car number ranges in `server/chalicelib/fleet.py`, `CARRIAGE_AGES` in `server/chalicelib/mbta_api.py`, and the counts in `src/static_data.json`. Pride and holiday cars are set with the comma-separated `PRIDE_TRAIN_CARS` / `HOLIDAY_TRAIN_CARS` environment variables in `server/.chalice/config.json`.

There's no Vite proxy: add any new deployment hostname to `src/constants.ts`, and keep the hostnames in `deploy.sh` and `server/.chalice/config.json` in sync.

## AWS Deployment
1. Make sure AWS CLI is set up and working — i.e. `aws cloudformation describe-stacks | wc -l` should work
2. Make sure these environment variables are set up in your shell (ask a Labs member for values if needed):
  - `TM_NTT_CERT_ARN` (for production)
  - `TM_LABS_WILDCARD_CERT_ARN` (for beta & production)
  - `DD_RUM_APPLICATION_ID` and `DD_RUM_CLIENT_TOKEN` (beta only, optional) enable Datadog RUM. Production builds ignore them.
3. A key named `transitmatters-ntt` needs to be available in your AWS account and copied to `~/.ssh/transitmatters-ntt.pem`.
4. Run `./deploy.sh` (add `-p` for production) to deploy.
5. You're all set! Visit:
- https://ntt-beta.labs.transitmatters.org for beta
- https://traintracker.transitmatters.org for production

## Other Deployments
This project generally fits the "Chalice app" mold. Contact us if you need help: labs@transitmatters.org

## Support TransitMatters
If you've found this app helpful or interesting, please consider [donating](https://transitmatters.org/donate) to TransitMatters to help support our mission to provide data-driven advocacy for a more reliable, sustainable, and equitable transit system in Metropolitan Boston.
