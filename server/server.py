import flask
import MbtaApi

app = flask.Flask(__name__)

@app.route("/data")
def data():
    return 'Hello, transit world!'

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
