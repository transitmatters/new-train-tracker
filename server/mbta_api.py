from urllib.parse import urlencode
import asyncio
import datetime
import pytz
import json_api_doc
import json
import os
import aiohttp
import tempfile

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


async def getV3(command, params={}, session=None):
    """Make a GET request against the MBTA v3 API"""
    url = BASE_URL_V3.format(command=command, parameters=urlencode(params))
    api_key = os.environ.get("MBTA_V3_API_KEY", "") or secrets.MBTA_V3_API_KEY
    headers = {"x-api-key": api_key} if api_key else {}

    async def inner(some_session):
        async with some_session.get(url, headers=headers) as response:
            response_json = await response.json()
            if response.status >= 400:
                print(
                    "API returned",
                    response.status,
                    "for",
                    url,
                    "-- it says",
                    response_json,
                )
            try:
                return json_api_doc.parse(response_json)
            except Exception as e:
                _, log_path = tempfile.mkstemp(suffix=".log")
                eastern = pytz.timezone('US/Eastern')
                now_eastern = datetime.datetime.now(eastern)
                print(f"[{now_eastern}] Writing problematic API response to {log_path}")
                with open(log_path, "w") as file:
                    file.write(json.dumps(response_json))
                raise e

    if session is None:
        async with aiohttp.ClientSession() as local_session:
            return await inner(local_session)
    else:
        return await inner(session)


def maybe_reverse(stops, route):
    if route in ["Green-B", "Green-C", "Green-E", "Orange"]:
        return list(reversed(stops))
    return stops


async def vehicle_data_for_routes(route_ids, test_mode=False):
    """Use getv3 to request real-time vehicle data for a given route set"""
    route_ids = normalize_custom_route_ids(route_ids)
    vehicles = await getV3(
        "vehicles",
        {
            "filter[route]": ",".join(route_ids),
            "include": "stop,trip.route_pattern.name",
        },
    )
    # Iterate vehicles, only send new ones to the browser
    vehicles_to_display = []
    for vehicle in vehicles:
        try:
            custom_route = derive_custom_route_name(vehicle)
            is_new = fleet.car_array_is_new(
                custom_route, vehicle["label"].split("-"), test_mode
            )
            if not is_new:
                continue
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
        except (KeyError, TypeError, AttributeError):
            continue
    return vehicles_to_display


async def stops_for_route(route_id):
    normalized_route_name = normalize_custom_route_name(route_id)
    stops = await getV3(
        "stops", {"filter[route]": normalized_route_name, "include": "route"}
    )
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
                            route, normalize_custom_route_ids, custom_route_name
                        ),
                        "directionNames": route["direction_names"],
                    }
                )
    return routes_to_return


async def initial_request_data(route_ids, test_mode=False):
    routes, vehicles, *stops = await asyncio.gather(
        *[
            routes_info(route_ids),
            vehicle_data_for_routes(route_ids, test_mode),
            *[stops_for_route(route_id) for route_id in route_ids],
        ]
    )
    sightings = get_recent_sightings_for_lines()
    return {
        "sightings": sightings,
        "routes": routes,
        "vehicles": vehicles,
        "stops": dict(zip(route_ids, stops)),
    }
