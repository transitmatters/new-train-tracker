import os
import json

import flask

import MbtaApi

application = flask.Flask(__name__)


@application.route("/")
def root():
    print("root!")
    return static_files("index.html")


@application.route("/<path:filename>")
def static_files(filename):
    return flask.send_from_directory("../dist", filename)


# Data routes
@application.route("/trains/<routes>")
def data(routes):
    return flask.Response(
        json.dumps(MbtaApi.vehicle_data_for_routes(routes.split(","), new_only=True)),
        mimetype="application/json",
    )


@application.route("/stations/<route>")
def stops(route):
    return flask.Response(
        json.dumps(MbtaApi.stops_for_route(route)), mimetype="application/json"
    )


if __name__ == "__main__":
    application.run(debug=(os.environ.get("NODE_ENV") != "production"))
