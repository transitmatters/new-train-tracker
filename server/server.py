import flask
import MbtaApi

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

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
