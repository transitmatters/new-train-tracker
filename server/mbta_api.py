"""
mbta_api.py provides functions dealing with interactions with the MBTA V3 API

"""


from urllib.parse import urlencode
import asyncio
import datetime
import pytz
import json_api_doc
import json
import os
import aiohttp
import tempfile
import traceback
import subprocess

from server.history.recent_sightings import get_recent_sightings_for_lines
import server.secrets as secrets
import server.fleet as fleet
from server.routes import (
    derive_custom_direction_destinations,
    derive_custom_route_name,
    normalize_custom_route_ids,
    normalize_custom_route_name,
    stop_belongs_to_custom_route,
)

BASE_URL_V3 = "https://api-v3.mbta.com/{command}?{parameters}"


# wrapper around MBTA V3 API
# used to simplify API calls
# returns JSON of requested data
async def getV3(command, params={}, session=None):
    """Make a GET request against the MBTA v3 API"""
    url = BASE_URL_V3.format(command=command, parameters=urlencode(params))
    api_key = os.environ.get("MBTA_V3_API_KEY", "") or secrets.MBTA_V3_API_KEY
    headers = {"x-api-key": api_key} if api_key else {}

    async def inner(some_session):
        async with some_session.get(url, headers=headers) as response:
            response_json = await response.json()
            eastern = pytz.timezone("US/Eastern")
            now_eastern = datetime.datetime.now(eastern)
            if response.status >= 400:
                print(
                    f"[{now_eastern}] API returned {response.status} for {url} -- it says {response_json}"
                )
            try:
                return json_api_doc.parse(response_json)
            except Exception as e:
                _, log_path = tempfile.mkstemp(suffix=".log")
                print(f"[{now_eastern}] Writing problematic API response to {log_path}")
                with open(log_path, "w") as file:
                    file.write(json.dumps(response_json))
                raise e

    if session is None:
        async with aiohttp.ClientSession() as local_session:
            return await inner(local_session)
    else:
        return await inner(session)


# ensures stops are in expected order specified in maybe_reverse()
def reverse_if_stops_out_of_order(stops, first_expected_stop_name, second_expected_stop_name):
    try:
        (index_of_first, index_of_second) = (
            next(index for index, stop in enumerate(stops) if stop["name"] == stop_name)
            for stop_name in (first_expected_stop_name, second_expected_stop_name)
        )
        if index_of_first > index_of_second:
            return list(reversed(stops))
        return stops
    except (StopIteration, RuntimeError):
        # This shouldn't happen if we specified our stops right
        return stops


# reverse stops if MBTA API returns them in unexpected order
def maybe_reverse(stops, route):
    if route.startswith("Green-"):
        return reverse_if_stops_out_of_order(stops, "Park Street", "Boylston")
    if route.startswith("Red-"):
        return reverse_if_stops_out_of_order(stops, "Park Street", "Downtown Crossing")
    if route == "Orange":
        return reverse_if_stops_out_of_order(stops, "Oak Grove", "Wellington")
    return stops


# takes a list of route ids
# uses getV3 to request real-time vehicle data for a given route id
# returns list of all vehicles
async def vehicle_data_for_routes(route_ids):
    route_ids = normalize_custom_route_ids(route_ids)
    vehicles = await getV3(
        "vehicles",
        {
            "filter[route]": ",".join(route_ids),
            "include": "stop,trip.route_pattern.name",
        },
    )

    # intialize empty list of vehicles to display
    vehicles_to_display = []

    # iterate over all vehicles fetched from V3 API
    for vehicle in vehicles:
        try:
            # derive Red Line vehicle branch if needed
            custom_route = derive_custom_route_name(vehicle)

            # determine if vehicle is new
            is_new = fleet.vehicle_array_is_new(custom_route, vehicle["label"].split("-"))

            vehicles_to_display.append(
                {
                    "label": vehicle["label"],
                    "route": custom_route,
                    "direction": vehicle["direction_id"],
                    "latitude": vehicle["latitude"],
                    "longitude": vehicle["longitude"],
                    "currentStatus": vehicle["current_status"],
                    "stationId": vehicle["stop"]["parent_station"]["id"],
                    "tripId": vehicle["trip"]["id"],
                    "isNewTrain": is_new,
                }
            )

        except Exception as e:
            eastern = pytz.timezone("US/Eastern")
            now_eastern = datetime.datetime.now(eastern)
            print(f"[{now_eastern}] Error processing vehicle {vehicle}: {e}")
            traceback.print_exc()
            continue

    return vehicles_to_display


def filter_new(vehicle_array):
    return list(filter(lambda veh: veh["isNewTrain"], vehicle_array))


def filter_old(vehicle_array):
    return list(filter(lambda veh: not veh["isNewTrain"], vehicle_array))


def filter_route(line, vehicle_array):
    return list(filter(lambda veh: line in veh["route"], vehicle_array))


def calc_stats(vehicle_array):
    totalGreen = filter_route("Green", vehicle_array)
    totalOrange = filter_route("Orange", vehicle_array)
    totalRed = filter_route("Red", vehicle_array)

    # intialize dictionary of stats
    vehicle_stats = {
        "Green": {
            "totalActive": len(totalGreen),
            "totalNew": len(filter_new(totalGreen)),
            "totalOld": len(filter_old(totalGreen)),
        },
        "Orange": {
            "totalActive": len(totalOrange),
            "totalNew": len(filter_new(totalOrange)),
            "totalOld": len(filter_old(totalOrange)),
        },
        "Red": {
            "totalActive": len(totalRed),
            "totalNew": len(filter_new(totalRed)),
            "totalOld": len(filter_old(totalRed)),
        }
    }

    return vehicle_stats


# returns list of dicts for every stop in a given route, based on route_id
# ensures stops are in expected order via maybe_reverse()
async def stops_for_route(route_id):
    normalized_route_name = normalize_custom_route_name(route_id)
    stops = await getV3("stops", {"filter[route]": normalized_route_name, "include": "route"})
    return maybe_reverse(
        list(
            map(
                lambda stop: {
                    "id": stop["id"],
                    "name": stop["name"],
                    "latitude": stop["latitude"],
                    "longitude": stop["longitude"],
                    "route": stop["route"],
                },
                filter(
                    lambda stop: stop_belongs_to_custom_route(
                        stop["id"], route_id, normalized_route_name
                    ),
                    stops,
                ),
            )
        ),
        route_id,
    )


# returns list of dicts containing directional information about routes based on the given route_id
async def routes_info(route_ids):
    routes_to_return = []
    custom_route_names = [s.strip() for s in route_ids]
    routes_info = await getV3(
        "routes",
        {"filter[id]": ",".join(normalize_custom_route_ids(custom_route_names))},
    )
    for custom_route_name in custom_route_names:
        normalized_route_name = normalize_custom_route_name(custom_route_name)
        for route in routes_info:
            if route["id"] == normalized_route_name:
                routes_to_return.append(
                    {
                        "id": custom_route_name,
                        "directionDestinations": derive_custom_direction_destinations(
                            route, normalized_route_name, custom_route_name
                        ),
                        "directionNames": route["direction_names"],
                    }
                )
    return routes_to_return


def get_git_tag():
    return str(subprocess.check_output(["git", "describe", "--tags", "--abbrev=0"]))[2:-3]


# captures initial request data from MBTA API as well as server-side data such as git tags and static train data
# returns JSON of all data
async def initial_request_data(route_ids, test_mode=False):
    routes, vehicle_data, *stops = await asyncio.gather(
        *[
            routes_info(route_ids),
            vehicle_data_for_routes(route_ids),
            *[stops_for_route(route_id) for route_id in route_ids],
        ]
    )
    sightings = get_recent_sightings_for_lines()
    git_tag = get_git_tag()
    return {
        "version": git_tag,
        "sightings": sightings,
        "routes": routes,
        "vehicles": vehicle_data,
        "vehicle_stats": calc_stats(vehicle_data),
        "stops": dict(zip(route_ids, stops)),
    }
