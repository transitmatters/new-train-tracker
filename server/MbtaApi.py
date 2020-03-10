from urllib.parse import urlencode
import requests
import json_api_doc
import os
import secrets
import Fleet

BASE_URL_V3 = "https://api-v3.mbta.com/{command}?{parameters}"

ROUTES_TO_REVERSE = ["Green-B", "Green-C", "Green-E"]


def getV3(command, params={}):
    """Make a GET request against the MBTA v3 API"""
    api_key = os.environ.get("MBTA_V3_API_KEY", "") or secrets.MBTA_V3_API_KEY
    headers = {"x-api-key": api_key} if api_key else {}
    response = requests.get(
        BASE_URL_V3.format(command=command, parameters=urlencode(params)),
        headers=headers,
    )
    return json_api_doc.parse(response.json())


def vehicle_data_for_routes(routes, new_only=False):
    """Use getv3 to request real-time vehicle data for a given route set"""
    vehicles = getV3("vehicles", {"filter[route]": ",".join(routes), "include": "stop"})
    # Iterate vehicles, only send new ones to the browser
    new_vehicles = []
    for vehicle in vehicles:
        print(vehicle)
        try:
            if not new_only or Fleet.car_array_is_new(
                vehicle["route"]["id"], vehicle["label"].split("-")
            ):
                new_vehicles.append(
                    {
                        "label": vehicle["label"],
                        "route": vehicle["route"]["id"],
                        "direction": vehicle["direction_id"],
                        "latitude": vehicle["latitude"],
                        "longitude": vehicle["longitude"],
                        "currentStatus": vehicle["current_status"],
                        "stationId": vehicle["stop"]["parent_station"]["id"],
                        "newFlag": True,
                    }
                )
        except (KeyError, TypeError):
            continue
    return new_vehicles


def maybe_reverse(stops, route):
    if route in ROUTES_TO_REVERSE:
        return list(reversed(stops))
    return stops


def stops_for_route(route):
    stops = getV3("stops", {"filter[route]": route})
    return maybe_reverse(
        list(
            map(
                lambda stop: {
                    "id": stop["id"],
                    "name": stop["name"],
                    "latitude": stop["latitude"],
                    "longitude": stop["longitude"],
                },
                stops,
            )
        ),
        route,
    )
