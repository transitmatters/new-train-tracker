# New Train Tracker
![lint](https://github.com/transitmatters/new-train-tracker/workflows/lint/badge.svg?branch=main)
![deploy](https://github.com/transitmatters/new-train-tracker/workflows/deploy/badge.svg?branch=main)

Developed by [TransitMatters Labs](https://transitmatters.org/transitmatters-labs)

Shows new MBTA Orange, Red, and Green Line trains as they come into service.

## Install & Run
Dependencies:
- `node 22.x` (with `npm 10.x`)
- `python 3.12`
- [`poetry`](https://python-poetry.org/)
  - Ensure `poetry` is using the correct Python version by running `poetry env use <your python3.12 binary>`

Run:
- `$ npm install`
- `$ npm start`
- visit [http://localhost:5173/](http://localhost:5173/)

To use an API key, put it as an environment variable `MBTA_V3_API_KEY`

### Linting
To lint frontend and backend code, run `$ npm run lint` in the root directory

To lint just frontend code, run `$ npm run lint-frontend`

To lint just backend code, run `$ npm run lint-backend`

## AWS Deployment
1. Make sure AWS CLI is set up and working — i.e. `aws cloudformation describe-stacks | wc -l` should work
2. Make sure these environment variables are set up in your shell (ask a Labs member for values if needed):
  - `TM_NTT_CERT_ARN` (for production)
  - `TM_LABS_WILDCARD_CERT_ARN` (for beta & production)
3. A key named `transitmatters-ntt` needs to be available in your AWS account and copied to `~/.ssh/transitmatters-ntt.pem`.
4. Run `./deploy.sh` (add `-p` for production) to deploy.
5. You're all set! Visit:
- https://ntt-beta.labs.transitmatters.org for beta
- https://traintracker.transitmatters.org for production

## Other Deployments
This project generally fits the "Chalice app" mold. Contact us if you need help: labs@transitmatters.org

## Support TransitMatters
If you've found this app helpful or interesting, please consider [donating](https://transitmatters.org/donate) to TransitMatters to help support our mission to provide data-driven advocacy for a more reliable, sustainable, and equitable transit system in Metropolitan Boston.
