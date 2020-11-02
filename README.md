# New Train Tracker

Developed by [TransitMatters](transitmatters.org)

Shows new MBTA Orange, Red, and Green Line trains as they come into service.

## Install & Run

Dependencies:
- `npm` `6.12.0`
- `node` `12.13.0`
- `python` `3.8`
- [`pipenv`](https://pipenv.readthedocs.io/en/latest/)

Run:
- `npm install`
- `npm start`
- visit [http://localhost:5000/](http://localhost:5000/)

To use an API key, put it in `server/secrets.py` or as an environment variable `MBTA_V3_API_KEY`

## Server Deployment

Additional requirements:
- nginx
- supervisord

Nginx serves as a reverse-proxy for the app running on localhost:5001.
The Flask app is being run under gunicorn, and this process is controlled by supervisor, which will restart after failure or reboot automatically. (Supervisor is similar to systemd in this regard)

For a fresh deploy:

- Copy devops/tracker-nginx.conf to /etc/nginx/sites-enabled. Probably restart nginx (`sudo systemctl restart nginx`)
- Copy devops/tracker-supervisor.conf to /etc/supervisor/conf.d
- Run `pipenv install`
- Run `npm run build`
- Run `sudo supervisorctl reload`

To deploy changes:

- If supervisor/nginx conf files changed, copy them to those directories and restart services accordingly.
- If Pipfile has changed, run `pipenv update`. (N.B. If the source of a package has changed, you may have to manually run `pipenv run pip uninstall ____` before updating so the old one is removed)
- `npm run build`
- `sudo supervisorctl restart new-train-tracker`