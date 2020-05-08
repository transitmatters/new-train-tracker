from urllib.parse import urlencode
import requests
import json_api_doc
import os
import secrets
import Fleet

BASE_URL_V3 = "https://api-v3.mbta.com/{command}?{parameters}"


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

    routes = normalize_custom_route_names(routes)

    vehicles = getV3(
        "vehicles",
        {"filter[route]": ",".join(routes), "include": "stop,trip.route_pattern"},
    )
    # Iterate vehicles, only send new ones to the browser
    vehicles_to_display = []
    for vehicle in vehicles:
        derive_custom_route_name(vehicle)
        try:
            vehicles_to_display.append(
                {
                    "label": vehicle["label"],
                    "route": derive_custom_route_name(vehicle),
                    "direction": vehicle["direction_id"],
                    "latitude": vehicle["latitude"],
                    "longitude": vehicle["longitude"],
                    "currentStatus": vehicle["current_status"],
                    "stationId": vehicle["stop"]["parent_station"]["id"],
                    "routePatternName": vehicle["trip"]["route_pattern"]["name"],
                    "isNewTrain": Fleet.car_array_is_new(
                        vehicle["route"]["id"], vehicle["label"].split("-")
                    ),
                }
            )
        except (KeyError, TypeError):
            continue
    return vehicles_to_display


def maybe_reverse(stops, route):
    if route in ["Green-B", "Green-C", "Green-E", "Orange"]:
        return list(reversed(stops))
    return stops


def stops_for_route(route_name):
    normalized_route_name = normalize_custom_route_name(route_name)
    stops = getV3("stops", {"filter[route]": normalized_route_name, "include": "route"})
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
                        stop["id"], route_name, normalized_route_name
                    ),
                    stops,
                ),
            )
        ),
        route_name,
    )


def routes_info(route_names_string):
    routes_to_return = []
    custom_route_names = [s.strip() for s in route_names_string.split(",")]
    routes_info = getV3(
        "routes",
        {"filter[id]": ",".join(normalize_custom_route_names(custom_route_names))},
    )
    for custom_route_name in custom_route_names:
        normalized_route_name = normalize_custom_route_name(custom_route_name)
        for route in routes_info:
            print(route["id"], normalized_route_name, custom_route_name)
            if route["id"] == normalized_route_name:
                routes_to_return.append(
                    {
                        "id": custom_route_name,
                        "directionDestinations": route["direction_destinations"],
                        "directionNames": route["direction_names"],
                    }
                )

    return routes_to_return


def derive_custom_route_name(vehicle):
    default_route_id = vehicle["route"]["id"]
    if default_route_id == "Red":
        route_pattern_name = vehicle["trip"]["route_pattern"]["name"]
        return "Red-A" if "Ashmont" in route_pattern_name else "Red-B"
    return default_route_id


def normalize_custom_route_name(route):
    return "Red" if route in ("Red-A", "Red-B") else route


def normalize_custom_route_names(routes):
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
