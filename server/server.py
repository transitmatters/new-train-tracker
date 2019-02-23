import flask
import MbtaApi
import json

app = flask.Flask(__name__)

@app.route("/data/Orange")
def data_orange():
    return flask.Response(json.dumps(MbtaApi.vehicle_data_for_route('Orange')))

if __name__ == "__main__":
    app.run(debug=True)
