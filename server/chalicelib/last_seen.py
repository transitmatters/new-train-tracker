import asyncio
import datetime
import json

import chalicelib.s3 as s3
import chalicelib.mbta_api as mbta_api
from chalicelib.routes import DEFAULT_ROUTE_IDS, get_line_for_route
from chalicelib.util import filter_new


JSON_PATH = "last_seen.json"
ROUTES = DEFAULT_ROUTE_IDS


async def update_recent_sightings():
    try:
        last_seen_times = json.loads(s3.download(JSON_PATH, "utf8", compressed=False))
    except Exception as e:
        print("Couldn't read last seen times from s3: ", e)
        last_seen_times = {}
    try:
        print("Updating recent sightings...")
        now = datetime.datetime.utcnow()

        all_vehicles = asyncio.run(mbta_api.vehicle_data_for_routes(ROUTES))
        new_vehicles = filter_new(all_vehicles)

        for vehicle in new_vehicles:
            line = get_line_for_route(vehicle["route"])
            last_seen_times[line] = {
                "car": vehicle["label"],
                # Python isoformat() doesn't include TZ, but we know this is UTC because we used utcnow() above
                "time": now.isoformat()[:-3] + "Z",
            }
        s3.upload(JSON_PATH, json.dumps(last_seen_times), compress=False)
    except Exception as e:
        print("Couldn't write last seen times to s3: ", e)


# Get the last time that a new train was seen on each line
# This is the function that other modules use
def get_recent_sightings_for_lines():
    return json.loads(s3.download(JSON_PATH, "utf8"))
