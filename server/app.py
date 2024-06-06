"""
app.py defines backend routes provided by the Chalice framework

"""

import os
import json
import asyncio

from chalicelib import (last_seen, mbta_api)
import chalicelib.healthcheck
from datadog_lambda.wrapper import datadog_lambda_wrapper
from chalice import Chalice, CORSConfig, ConvertToMiddleware, Response, Cron

app = Chalice(app_name="new-train-tracker")

localhost = "localhost:3000"
TM_CORS_HOST = os.environ.get("TM_CORS_HOST", localhost)

if TM_CORS_HOST != localhost:
    app.register_middleware(ConvertToMiddleware(datadog_lambda_wrapper))
    cors_config = CORSConfig(allow_origin=f"https://{TM_CORS_HOST}", max_age=3600)
else:
    cors_config = CORSConfig(allow_origin="*", max_age=3600)


# takes a comma-delimited string of route ids
@app.route("/trains/{route_ids_string}", cors=cors_config)
def trains(route_ids_string):
    route_ids = route_ids_string.split(",")
    vehicle_data = asyncio.run(mbta_api.vehicle_data_for_routes(route_ids))
    return Response(json.dumps(vehicle_data), headers={"Cache-Control": "no-cache", "Access-Control-Allow-Origin": "*"})


# takes a single route id
# returns a JSON object containing all stops in route
@app.route("/stops/{route_id}", cors=cors_config)
def stops(route_id):
    stop_data = asyncio.run(mbta_api.stops_for_route(route_id))
    return Response(json.dumps(stop_data), headers={"Content-Type": "application/json"})


# takes a comma-delimited string of route ids
# returns a JSON object containing all routes with directional information
@app.route("/routes/{route_ids_string}", cors=cors_config)
def routes(route_ids_string):
    route_ids = route_ids_string.split(",")
    route_data = asyncio.run(mbta_api.routes_info(route_ids))
    return Response(json.dumps(route_data), headers={"Content-Type": "application/json"})


# takes a single trip id
# returns the predicted departure of said trip from a given stop
@app.route("/predictions/{trip_id}/{stop_id}", cors=cors_config)
def vehicles(trip_id, stop_id):
    departure = asyncio.run(mbta_api.trip_departure_predictions(trip_id, stop_id))
    return Response(json.dumps(departure), headers={"Content-Type": "application/json"})


@app.schedule(Cron("0/10", "0-6,9-23", "*", "*", "?", "*"))
def update_last_seen(event):
    last_seen.update_recent_sightings()


@app.route("/healthcheck", cors=cors_config)
def healthcheck():
    return chalicelib.healthcheck.run()


def get_static_data():
    with open("./public/static_data.json") as f:
        static_data = json.load(f)
    return static_data


def get_port():
    env_port = os.environ.get("PORT")
    if env_port is not None:
        return int(env_port)
    return 5000


def get_debug():
    return os.environ.get("NODE_ENV") != "production"
