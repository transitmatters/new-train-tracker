def normalize_custom_route_name(route):
    return "Red" if route in ("Red-A", "Red-B") else route


def normalize_custom_route_ids(routes):
    return set(map(normalize_custom_route_name, routes))


def derive_custom_route_name(vehicle):
    default_route_id = vehicle["route"]["id"]
    if default_route_id == "Red":
        route_pattern_name = vehicle["trip"]["route_pattern"]["name"]
        return "Red-A" if "Ashmont" in route_pattern_name else "Red-B"
    return default_route_id


def derive_custom_direction_destinations(
    route, normalized_route_name, custom_route_name
):
    if normalized_route_name == "Red":
        if custom_route_name == "Red-A":
            return ["Ashmont", "Alewife"]
        else:
            return ["Braintree", "Alewife"]
    return route["direction_destinations"]


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


DEFAULT_ROUTE_IDS = [
    "Green-B",
    "Green-C",
    "Green-D",
    "Green-E",
    "Orange",
    "Red-A",
    "Red-B",
]
