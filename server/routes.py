"""
routes.py provides functions dealing with route data manipulation
"""

GREEN_ROUTE_IDS = [
    "Green-B",
    "Green-C",
    "Green-D",
    "Green-E",
]

DEFAULT_ROUTE_IDS = [
    "Orange",
    "Red-A",
    "Red-B",
    *GREEN_ROUTE_IDS,
]

SILVER_ROUTE_IDS = [
    "741",
    "742",
    "743",
    "751",
    "749",
    "746",
]


# "normalizes" route id by aggregating "Red-A" and "Red-B" ids into "Red"
def normalize_custom_route_name(route_id):
    return "Red" if route_id in ("Red-A", "Red-B") else route_id


# takes a list of route ids
# returns a "normalized" set of route ids
def normalize_custom_route_ids(route_ids):
    return set(map(normalize_custom_route_name, route_ids))


# derives custom route id for Red Line vehicles
# purpose is to determine if Red Line vehicle is part of Ashmont or Braintree line
# takes no action on Green or Orangle Line vehicles
def derive_custom_route_name(vehicle):
    default_route_id = vehicle["route"]["id"]
    try:
        if default_route_id == "Red":
            route_pattern_name = vehicle["trip"]["route_pattern"]["name"]
            return "Red-A" if "Ashmont" in route_pattern_name else "Red-B"
    except TypeError:
        # If there's no route pattern, leave the route id as is (i.e. "Red")
        pass
    return default_route_id


# determines line terminus for custom Red Line routes
def derive_custom_direction_destinations(route, normalized_route_name, custom_route_name):
    if normalized_route_name == "Red":
        if custom_route_name == "Red-A":
            return ["Ashmont", "Alewife"]
        else:
            return ["Braintree", "Alewife"]
    return route["direction_destinations"]


# determines if a given stop id is in the Red Line Ashmont branch or Braintree branch
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


def get_line_for_route(route):
    return route.split("-")[0]
