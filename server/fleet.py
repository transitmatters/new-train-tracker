"""
fleet.py provides functions used to determine whether vehicles are "new" or not

"new" encompasses
- CRRC-built trainsets for the Orange and Red Lines
- CAF-built (Type-9) trainsets for the Green Line
- BEBs (Battery Electric Buses) for the Silver Line

"""


from server.routes import GREEN_ROUTE_IDS, SILVER_ROUTE_IDS

red_is_new = lambda x: int(x) >= 1900 and int(x) <= 2151
green_is_new = lambda x: int(x) >= 3900 and int(x) <= 3924
orange_is_new = lambda x: int(x) >= 1400 and int(x) <= 1551
silver_is_new = lambda x: int(x) >= 1294 and int(x) <= 1299


def get_is_new_dict(route_ids, test_fn):
    return {route_id: test_fn for route_id in route_ids}


vehicle_is_new = {
    "Red-A": red_is_new,
    "Red-B": red_is_new,
    "Orange": orange_is_new,
    **get_is_new_dict(GREEN_ROUTE_IDS, green_is_new),
    **get_is_new_dict(SILVER_ROUTE_IDS, silver_is_new),
}


def vehicle_is_new(route_name, car):
    return vehicle_is_new[route_name](car)


def vehicle_array_is_new(route_name, arr):
    return any(map(vehicle_is_new[route_name], arr))
