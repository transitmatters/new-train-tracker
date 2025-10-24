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
    "Blue",
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

RED_A_STOP_IDS = [
    "70085",
    "70086",
    "70087",
    "70088",
    "70089",
    "70090",
    "70091",
    "70092",
    "70093",
    "70094",
]

CR_Franklin_A_STOP_IDS = ["place-FB-0303", "place-FB-0275", "place-FB-0230", "place-FB-0191"]
CR_Franklin_B_STOP_IDS = ["place-FS-0049"]

CR_Providence_A_STOP_IDS = ["place-SB-0156", "place-SB-0189"]
CR_Providence_B_STOP_IDS = [
    "place-NEC-1659",
    "place-NEC-1768",
    "place-NEC-1851",
    "place-NEC-1891",
    "place-NEC-1919",
    "place-NEC-1969",
    "place-NEC-2040",
    "place-NEC-2108",
]


# "normalizes" route id by aggregating "Red-A" and "Red-B" ids into "Red"
def normalize_custom_route_name(route_id):
    if route_id in ("Red-A", "Red-B"):
        return "Red"
    if route_id in ("CR-Franklin-A", "CR-Franklin-B"):
        return "CR-Franklin"
    if route_id in ("CR-Providence-A", "CR-Providence-B"):
        return "CR-Providence"
    else:
        return route_id


# takes a list of route ids
# returns a "normalized" set of route ids
def normalize_custom_route_ids(route_ids):
    return set(map(normalize_custom_route_name, route_ids))


# derives custom route id for Red Line vehicles
# purpose is to determine if Red Line vehicle is part of Ashmont or Braintree line
# takes no action on Green or Orangle Line vehicles
def derive_custom_route_name(vehicle):
    default_route_id = vehicle["route"]["id"]
    if default_route_id == "Red":
        # First try to figure it out by route pattern
        try:
            route_pattern_name = vehicle["trip"]["route_pattern"]["name"]
            return "Red-A" if "Ashmont" in route_pattern_name else "Red-B"
        except Exception:
            pass
        # Second try to figure it out by whether its stop status is on the Ashmont branch
        try:
            if vehicle["stop"]["id"] in RED_A_STOP_IDS:
                return "Red-A"
            return "Red-B"
        except Exception:
            pass

    if default_route_id == "CR-Franklin":
        # First try to figure it out by route pattern
        try:
            route_pattern_name = vehicle["trip"]["route_pattern"]["name"]
            return "CR-Franklin-A" if "Forge Park/495" in route_pattern_name else "CR-Franklin-B"
        except Exception:
            pass
        # Second try to figure it out by whether its stop status is on the Ashmont branch
        try:
            if vehicle["stop"]["id"] in CR_Franklin_A_STOP_IDS:
                return "CR-Franklin-A"
            return "CR-Franklin-B"
        except Exception:
            pass

    if default_route_id == "CR-Providence":
        # First try to figure it out by route pattern
        try:
            route_pattern_name = vehicle["trip"]["route_pattern"]["name"]
            return "CR-Providence-A" if "Providence" in route_pattern_name else "CR-Providence-B"
        except Exception:
            pass
        # Second try to figure it out by whether its stop status is on the Ashmont branch
        try:
            if vehicle["stop"]["id"] in CR_Providence_A_STOP_IDS:
                return "CR-Providence-A"
            return "CR-Providence-B"
        except Exception:
            pass

        # If that all fails, RIP
    return default_route_id


# determines line terminus for custom Red Line routes
def derive_custom_direction_destinations(route, normalized_route_name, custom_route_name):
    if normalized_route_name == "Red":
        if custom_route_name == "Red-A":
            return ["Ashmont", "Alewife"]
        else:
            return ["Braintree", "Alewife"]
    if normalized_route_name == "CR-Franklin":
        if custom_route_name == "CR-Franklin-A":
            return ["Forge Park/495", "South Station"]
        else:
            return ["Foxboro", "South Station"]

    if normalized_route_name == "CR-Providence":
        if custom_route_name == "CR-Providence-A":
            return ["Wickford Junction", "South Station"]
        else:
            return ["Stoughton", "South Station"]
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
    if normalized_route_name != "CR-Franklin":
        return True
    if custom_route_name == "CR-Franklin-A":
        return stop_id not in CR_Franklin_B_STOP_IDS
    if custom_route_name == "CR-Franklin-B":
        return stop_id not in CR_Franklin_A_STOP_IDS
    if normalized_route_name != "CR-Providence":
        return True
    if normalized_route_name != "CR-Providence":
        return True
    if custom_route_name == "CR-Providence-A":
        return stop_id not in CR_Providence_B_STOP_IDS
    if custom_route_name == "CR-Providence-B":
        return stop_id not in CR_Providence_A_STOP_IDS
    return True


def get_line_for_route(route):
    return route.split("-")[0]
