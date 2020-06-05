import os
import json
import asyncio
import flask
import MbtaApi

application = flask.Flask(__name__, template_folder="../dist")

DEFAULT_ROUTE_IDS = [
    "Green-B",
    "Green-C",
    "Green-D",
    "Green-E",
    "Orange",
    "Red"
]

@application.route("/<path:filename>")
def static_files(filename):
    return flask.send_from_directory("../dist", filename)


@application.route("/trains/<route_ids_string>")
def data(route_ids_string):
    route_ids = route_ids_string.split(",")
    test_mode = flask.request.args.get("testMode")
    vehicle_data = asyncio.run(
        MbtaApi.vehicle_data_for_routes(route_ids, test_mode=test_mode)
    )
    return flask.Response(json.dumps(vehicle_data), mimetype="application/json",)


@application.route("/stops/<route_id>")
def stops(route_id):
    stop_data = asyncio.run(MbtaApi.stops_for_route(route_id))
    return flask.Response(json.dumps(stop_data), mimetype="application/json")


@application.route("/routes/<route_ids_string>")
def routes(route_ids_string):
    route_ids = route_ids_string.split(",")
    route_data = asyncio.run(MbtaApi.routes_info(route_ids))
    return flask.Response(json.dumps(route_data), mimetype="application/json")


@application.route("/")
def root():
    test_mode = flask.request.args.get("testMode")
    shell = flask.request.args.get("shell")
    if shell:
        return static_files("index.html")
    initial_data = asyncio.run(
        MbtaApi.initial_request_data(DEFAULT_ROUTE_IDS, test_mode)
    )
    return flask.render_template("index.html", initial_data=initial_data)


def get_port():
    env_port = os.environ.get("PORT")
    if env_port is not None:
        return int(env_port)
    return 5000


def get_debug():
    return os.environ.get("NODE_ENV") != "production"

if __name__ == "__main__":
    application.run(host="0.0.0.0", port=get_port(), debug=get_debug())
