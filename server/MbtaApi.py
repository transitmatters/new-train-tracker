from urllib.parse import urlencode
import asyncio
import json_api_doc
import json
import os
import aiohttp
import secrets
import time
import tempfile

import Fleet

BASE_URL_V3 = "https://api-v3.mbta.com/{command}?{parameters}"

async def getV3(command, params={}, session=None):
    """Make a GET request against the MBTA v3 API"""
    url = BASE_URL_V3.format(command=command, parameters=urlencode(params))
    api_key = os.environ.get("MBTA_V3_API_KEY", "") or secrets.MBTA_V3_API_KEY
    headers = {"x-api-key": api_key} if api_key else {}

    async def inner(some_session):
        async with some_session.get(url, headers=headers) as response:
            if response.status >= 400:
                print("API returned", response.status, "for", url)
            response_json = await response.json()
            try:
                return json_api_doc.parse(response_json)
            except Exception as e:
                _, log_path = tempfile.mkstemp(suffix=".log")
                print(f"Writing problematic API response to {log_path}")
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


def derive_custom_route_name(vehicle):
    default_route_id = vehicle["route"]["id"]
    # if default_route_id == "Red":
    #     route_pattern_name = vehicle["trip"]["route_pattern"]["name"]
    #     return "Red-A" if "Ashmont" in route_pattern_name else "Red-B"
    return default_route_id


def normalize_custom_route_name(route):
    return "Red" if route in ("Red-A", "Red-B") else route


def normalize_custom_route_ids(routes):
    return set(map(normalize_custom_route_name, routes))


def stop_belongs_to_custom_route(stop_id, custom_route_name, normalized_route_name):
    if normalized_route_name != "Red":
        return True
    if custom_route_name == "Red-A":
        return stop_id not in (
            "place-nqncy",
            "place-wlsta",
            "place-qnctr",
            "place-qamnl",
            "place-brntn",
        )
    if custom_route_name == "Red-B":
        return stop_id not in (
            "place-shmnl",
            "place-fldcr",
            "place-smmnl",
            "place-asmnl",
        )
    return True


async def vehicle_data_for_routes(route_ids, test_mode=False):
    """Use getv3 to request real-time vehicle data for a given route set"""
    route_ids = normalize_custom_route_ids(route_ids)
    vehicles = await getV3(
        "vehicles",
        {"filter[route]": ",".join(route_ids), "include": "stop"},
    )
    # Iterate vehicles, only send new ones to the browser
    vehicles_to_display = []
    for vehicle in vehicles:
        try:
            is_new = Fleet.car_array_is_new(
                vehicle["route"]["id"], vehicle["label"].split("-"), test_mode
            )
            if not is_new:
                continue
            vehicles_to_display.append(
                {
                    "label": vehicle["label"],
                    "route": derive_custom_route_name(vehicle),
                    "direction": vehicle["direction_id"],
                    "latitude": vehicle["latitude"],
                    "longitude": vehicle["longitude"],
                    "currentStatus": vehicle["current_status"],
                    "stationId": vehicle["stop"]["parent_station"]["id"],
                    "isNewTrain": is_new,
                }
            )
        except (KeyError, TypeError):
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
                        "directionDestinations": route["direction_destinations"],
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
    return {
        "routes": routes,
        "vehicles": vehicles,
        "stops": dict(zip(route_ids, stops)),
    }
