import os
import json

import flask

import MbtaApi

application = flask.Flask(__name__)


@application.route("/")
def root():
    return static_files("index.html")


@application.route("/<path:filename>")
def static_files(filename):
    return flask.send_from_directory("../dist", filename)


# Data routes
@application.route("/trains/<routes>")
def data(routes):
    test_mode = flask.request.args.get("testMode")
    return flask.Response(
        json.dumps(
            MbtaApi.vehicle_data_for_routes(routes.split(","), test_mode=test_mode)
        ),
        mimetype="application/json",
    )


@application.route("/stations/<route>")
def stops(route):
    return flask.Response(
        json.dumps(MbtaApi.stops_for_route(route)), mimetype="application/json"
    )


@application.route("/routes/<route_ids>")
def routes(route_ids):
    return flask.Response(
        json.dumps(MbtaApi.routes_info(route_ids)), mimetype="application/json"
    )


if __name__ == "__main__":
    application.run(host="0.0.0.0", debug=(os.environ.get("NODE_ENV") != "production"))
