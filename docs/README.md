# New Train Tracker
![lint](https://github.com/transitmatters/new-train-tracker/workflows/lint/badge.svg)
![deploy](https://github.com/transitmatters/new-train-tracker/workflows/deploy/badge.svg)

Developed by [TransitMatters](transitmatters.org)

Shows new MBTA Orange, Red, and Green Line trains as they come into service.

## Install & Run
Dependencies:
- `npm` `6.12.0`
- `node` `12.13.0`
- `python` `3.8`
- [`pipenv`](https://pipenv.readthedocs.io/en/latest/)
- [`postgresql`](https://www.postgresql.org/)

Run:
- `npm install`
- `npm run create-history-db` if it is your first time running the application, `npm run update-history-db` otherwise
- `npm start`
- visit [http://localhost:5000/](http://localhost:5000/)

To use an API key, put it in `server/secrets.py` or as an environment variable `MBTA_V3_API_KEY`

On Windows:
Before running `npm install`,
- Ensure that `python3` in the `start-python`,`create-history-db`, and `update-history-db` is updated to `python`.
- update `server/secrets.py` `POSTGRES_USER` and `POSTGRES_PASS` variables with your credentials.

### Linting
To lint frontend and backend code, run `npm run lint` in the root directory

To lint just frontend code, run `npm run lint-frontend`

To lint just backend code, run `npm run lint-backend`

## Server Deployment
Additional requirements:
- nginx
- supervisord

Nginx serves as a reverse-proxy for the app running on localhost:5001.
The Flask app is being run under gunicorn, and this process is controlled by supervisor, which will restart after failure or reboot automatically. (Supervisor is similar to systemd in this regard)

### For a fresh deploy

- Copy `devops/tracker-nginx.conf` into `/etc/nginx/sites-enabled/`. Probably restart nginx (`sudo systemctl restart nginx`)
- Copy `devops/tracker-supervisor.conf` into `/etc/supervisor/conf.d/`
- Run `pipenv install`
- Run `npm run build`
- Run `sudo supervisorctl reload`

### To deploy changes

- If supervisor/nginx conf files changed, copy them to those directories and restart services accordingly.
- If Pipfile has changed, run `pipenv update`. (N.B. If the source of a package has changed, you may have to manually run `pipenv run pip uninstall ____` before updating so the old one is removed)
- `npm run build`
- `sudo supervisorctl restart new-train-tracker`

#### Deploy changes with Ansible
You can deploy changes to this application on an AWS Lightsail instance running Ubuntu using the `deploy-on-lightsail.yaml` Ansible playbook.

To do so, install Ansible, create an inventory file, and run the playbook with your AWS Private Key in the same directory using the command below:

`$ ansible-playbook devops/deploy-on-lightsail.yml -i inventory --private-key aws_private_key.pem`
