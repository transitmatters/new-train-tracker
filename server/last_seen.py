import asyncio
import datetime
import json
import schedule

import server.mbta_api as mbta_api
import server.secrets as secrets
from server.routes import get_line_for_route
from server.routes import DEFAULT_ROUTE_IDS
from server.util import filter_new


JSON_PATH = "last_seen.json"
LAST_SEEN_TIMES = {}
ROUTES = DEFAULT_ROUTE_IDS


def update_recent_sightings_sync():
    asyncio.run(update_recent_sightings())


def initialize():
    global LAST_SEEN_TIMES

    # Read from disk if there's a previous file there
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as file:
            LAST_SEEN_TIMES = json.load(file)
    except FileNotFoundError:
        print("Last seen file doesn't exist; starting fresh")

    if not secrets.LAST_SEEN_UPDATE:
        print("LAST_SEEN_UPDATE is false, so I'm not continuously updating last seen times for you.")
        return
    schedule.every().minute.do(update_recent_sightings_sync)


async def update_recent_sightings():
    print("Updating recent sightings...")
    now = datetime.datetime.utcnow()

    all_vehicles = await mbta_api.vehicle_data_for_routes(ROUTES)
    new_vehicles = filter_new(all_vehicles)

    for vehicle in new_vehicles:
        line = get_line_for_route(vehicle["route"])
        LAST_SEEN_TIMES[line] = {
            "car": vehicle["label"],
            "time": now.isoformat()
        }

    try:
        with open(JSON_PATH, "w", encoding="utf-8") as file:
            json.dump(LAST_SEEN_TIMES, file, indent=4, sort_keys=True, default=str)
    except Exception as e:
        print("Couldn't write last seen times to disk: ", e)


# Get the last time that a new train was seen on each line
# This is the function that other modules use
def get_recent_sightings_for_lines():
    return LAST_SEEN_TIMES


# For development/testing only!
if __name__ == "__main__":
    initialize()
    asyncio.run(update_recent_sightings())
