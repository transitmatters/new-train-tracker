"""
application.py defines backend routes provided by the Flask framework

"""

import os
import json
import asyncio
import flask

import server.mbta_api as mbta_api
from server.routes import DEFAULT_ROUTE_IDS
from server.history.statistics import get_cached_summaries

application = flask.Flask(__name__, template_folder="../dist")


# use dist as app root
@application.route("/<path:filename>")
def static_files(filename):
    return flask.send_from_directory("../dist", filename)


# takes a comma-delimited string of route ids
# if test_mode is false, returns a JSON object containing new vehicles
# if test_mode is true, returns a JSON object containing all vehicles
@application.route("/trains/<route_ids_string>")
def trains(route_ids_string):
    route_ids = route_ids_string.split(",")
    test_mode = flask.request.args.get("testMode")
    vehicle_data = asyncio.run(
        mbta_api.vehicle_data_for_routes(route_ids)
    )
    if not test_mode:
        vehicle_data = mbta_api.filter_new(vehicle_data)
    return flask.Response(json.dumps(vehicle_data), mimetype="application/json")


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

@application.route("/statistics")
def statistics():
    summaries_by_route = get_cached_summaries()
    return flask.Response(json.dumps(summaries_by_route), mimetype="application/json")


# root function to serve landing page
# add ?testMode=1 to enable test mode
#   if test mode is true, app will show all trains, not just new ones
# if shell mode is true, app will generate without getting any intital API data
@application.route("/")
def root():
    test_mode = flask.request.args.get("testMode")
    shell = flask.request.args.get("shell")
    if shell:
        return static_files("index.html")
    initial_data = asyncio.run(
        mbta_api.initial_request_data(DEFAULT_ROUTE_IDS, test_mode)
    )
    initial_data["static_data"] = get_static_data()
    return flask.render_template("index.html", initial_data=initial_data)


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
