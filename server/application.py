import flask
import MbtaApi
import json

application = flask.Flask(__name__)

@application.route('/')
def root():
    return static_files("index.html")

@application.route('/<path:filename>')
def static_files(filename):
    return flask.send_from_directory("../static", filename)

@application.route('/assets/<path:filename>')
def assets(filename):
    return flask.send_from_directory("../assets", filename)

@application.route('/js/<path:filename>')
def js(filename):
    return flask.send_from_directory("../build/js", filename)

# Data routes
@application.route("/data/<routes>")
def data(routes):
    return flask.Response(json.dumps(MbtaApi.vehicle_data_for_routes(routes.split(','))))

@application.route("/stops/<route>")
def stops(route):
    return flask.Response(json.dumps(MbtaApi.stops_for_route(route)))


if __name__ == "__main__":
    application.run(debug=True)
