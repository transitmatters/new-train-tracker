"""
fleet.py provides functions used to determine information about vehicles

"new" encompasses
- CRRC-built trainsets for the Orange and Red Lines
- CAF-built (Type-9) trainsets for the Green Line
- BEBs (Battery Electric Buses) for the Silver Line

"eyes" encompasses trains that have googly eyes 👀

"""

from chalicelib.routes import GREEN_ROUTE_IDS, SILVER_ROUTE_IDS

red_is_new = lambda x: int(x) >= 1900 and int(x) <= 2151
green_is_new = lambda x: int(x) >= 3900 and int(x) <= 3924
orange_is_new = lambda x: int(x) >= 1400 and int(x) <= 1551
silver_is_new = lambda x: int(x) >= 1294 and int(x) <= 1299
blue_is_new = lambda _: False

red_has_eyes = lambda _: False
green_has_eyes = lambda x: int(x) in [3909, 3864, 3918]
blue_has_eyes = lambda _: False
orange_has_eyes = lambda _: False
silver_has_eyes = lambda _: False
blue_has_eyes = lambda _: False


def get_route_test_function_dict(route_ids, test_fn):
    return {route_id: test_fn for route_id in route_ids}


vehicle_is_new_func = {
    "Red-A": red_is_new,
    "Red-B": red_is_new,
    "Orange": orange_is_new,
    **get_route_test_function_dict(GREEN_ROUTE_IDS, green_is_new),
    **get_route_test_function_dict(SILVER_ROUTE_IDS, silver_is_new),
    "Blue": blue_is_new,
}

vehicle_has_eyes_func = {
    "Red-A": red_has_eyes,
    "Red-B": red_has_eyes,
    "Orange": orange_has_eyes,
    **get_route_test_function_dict(GREEN_ROUTE_IDS, green_has_eyes),
    **get_route_test_function_dict(SILVER_ROUTE_IDS, silver_has_eyes),
    "Blue": blue_has_eyes,
}


def vehicle_is_new(route_name, car):
    return vehicle_is_new_func[route_name](car)

def vehicle_array_is_new(route_name, arr):
    return any(map(vehicle_is_new_func[route_name], arr))

def vehicle_array_has_eyes(route_name, arr):
    return any(map(vehicle_has_eyes_func[route_name], arr))

