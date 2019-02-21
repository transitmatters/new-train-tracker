# New Train Tracker

Developed by [TransitMatters](transitmatters.org)

Shows new MBTA Orange, Red, and Green Line trains as they come into service.

## Install & Run - UI

(Using npm 6.4.1 and node 10.15.0)

- `npm install`
- `npm start`
- visit `localhost:8000/src/Main.elm`

## Install & Run - Server

(Using Python 3.7 and [pipenv](https://pipenv.readthedocs.io/en/latest/))

- Drop your MBTA v3 API key in secrets.py
- `pipenv install`
- `pipenv shell`
- `python server.py`
- visit [http://localhost:5000/data](http://localhost:5000/data)