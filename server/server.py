import flask
import MbtaApi
import json

app = flask.Flask(__name__)

@app.route('/')
def root():
    return static_files("index.html")

@app.route('/<path:filename>')
def static_files(filename):
    return flask.send_from_directory("../static", filename)

@app.route('/js/<path:filename>')
def js(filename):
    return flask.send_from_directory("../js", filename)

# Data routes
@app.route("/data/<routes>")
def data(routes):
    return flask.Response(json.dumps(MbtaApi.vehicle_data_for_routes(routes.split(','))))

if __name__ == "__main__":
    app.run(debug=True)
