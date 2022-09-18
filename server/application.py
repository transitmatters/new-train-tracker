"""
application.py defines backend routes provided by the Flask framework

"""

import os
import json
import asyncio
import flask

import server.background as background
import server.healthcheck
import server.initial_data as initial_data
import server.last_seen as last_seen
import server.mbta_api as mbta_api
from server.routes import DEFAULT_ROUTE_IDS

application = flask.Flask(__name__, template_folder="../dist")


# Start a background thread to run `schedule` (i.e. the package) jobs,
# which in our case is just the "last seen" update
background_thread = background.run_continuously()
last_seen.initialize()


# use dist as app root
@application.route("/<path:filename>")
def static_files(filename):
    return flask.send_from_directory("../dist", filename)


# takes a comma-delimited string of route ids
@application.route("/trains/<route_ids_string>")
def trains(route_ids_string):
    route_ids = route_ids_string.split(",")
    vehicle_data = asyncio.run(
        mbta_api.vehicle_data_for_routes(route_ids)
    )
    return flask.Response(json.dumps(vehicle_data), mimetype="application/json", headers={
        "Cache-Control": "no-cache"
    })


# takes a single route id
# returns a JSON object containing all stops in route
@application.route("/stops/<route_id>")
def stops(route_id):
    stop_data = asyncio.run(mbta_api.stops_for_route(route_id))
    return flask.Response(json.dumps(stop_data), mimetype="application/json")


# takes a comma-delimited string of route ids
# returns a JSON object containing all routes with directional information
@application.route("/routes/<route_ids_string>")
def routes(route_ids_string):
    route_ids = route_ids_string.split(",")
    route_data = asyncio.run(mbta_api.routes_info(route_ids))
    return flask.Response(json.dumps(route_data), mimetype="application/json")

@application.route("/healthcheck")
def healthcheck():
    return server.healthcheck.run()

# root function to serve landing page
@application.route("/")
def root():
    shell = flask.request.args.get("shell")
    if shell:
        return static_files("index.html")
    payload = asyncio.run(
        initial_data.initial_request_data(DEFAULT_ROUTE_IDS)
    )
    payload["static_data"] = get_static_data()

    response = flask.make_response(flask.render_template("index.html", initial_data=payload))
    response.headers["Cache-Control"] = "no-cache"
    return response


def get_static_data():
    with open('./static/static_data.json') as f:
        static_data = json.load(f)
    return static_data


def get_port():
    env_port = os.environ.get("PORT")
    if env_port is not None:
        return int(env_port)
    return 5000


def get_debug():
    return os.environ.get("NODE_ENV") != "production"


if __name__ == "__main__":
    application.run(host="0.0.0.0", port=get_port(), debug=get_debug())
