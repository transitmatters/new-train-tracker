# New Train Tracker
![lint](https://github.com/transitmatters/new-train-tracker/workflows/lint/badge.svg?branch=master)
![deploy](https://github.com/transitmatters/new-train-tracker/workflows/deploy/badge.svg?branch=master)

Developed by [TransitMatters](https://transitmatters.org/)

Shows new MBTA Orange, Red, and Green Line trains as they come into service.

## Install & Run
Dependencies:
- `node` `16.x`
- `python` `3.8`
- [`poetry`](https://python-poetry.org/)

Run:
- `npm install`
- `npm start`
- visit [http://localhost:5000/](http://localhost:5000/)

To use an API key, put it in `server/secrets.py` or as an environment variable `MBTA_V3_API_KEY`

### Linting
To lint frontend and backend code, run `npm run lint` in the root directory

To lint just frontend code, run `npm run lint-frontend`

To lint just backend code, run `npm run lint-backend`

## Server Deployment
Additional requirements:
- nginx

Nginx serves as a reverse-proxy for the app running on localhost:5001.
The Flask app is run under gunicorn and controlled by systemd, which will restart after failure or reboot automatically.

### For a deploy on AWS (fresh, or not)
1. Make sure AWS CLI is set up and working—i.e. `aws cloudformation describe-stacks | wc -l` should work.
2. Make sure these environment variables are set up in your shell (ask a Labs member for values if needed):
  - `TM_NTT_CERT_ARN` (for production)
  - `TM_LABS_WILDCARD_CERT_ARN` (for beta)
3. A key named `transitmatters-ntt` needs to be available in your AWS account and copied to `~/.ssh/transitmatters-ntt.pem`.
4. Run `cd devops && ./deploy.sh` (add -p for production) to deploy.
5. You're all set! Visit:
- https://ntt-beta.labs.transitmatters.org for beta
- https://traintracker.transitmatters.org for production

### For a deploy elsewhere
This project generally fits the "Flask app" mold. Contact us if you need help: labs@transitmatters.org
