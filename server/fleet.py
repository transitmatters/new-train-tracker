from server.routes import GREEN_ROUTE_IDS, SILVER_ROUTE_IDS

red_is_new = lambda x: int(x) >= 1900 and int(x) <= 2151
green_is_new = lambda x: int(x) >= 3900 and int(x) <= 3924
orange_is_new = lambda x: int(x) >= 1400 and int(x) <= 1551
silver_is_new = lambda x: int(x) >= 1294 and int(x) <= 1


def get_is_new_dict(route_ids, test_fn):
    return {route_id: test_fn for route_id in route_ids}


train_is_new_func = {
    "Red-A": red_is_new,
    "Red-B": red_is_new,
    "Orange": orange_is_new,
    **get_is_new_dict(GREEN_ROUTE_IDS, green_is_new),
    **get_is_new_dict(SILVER_ROUTE_IDS, silver_is_new),
}


def car_is_new(route_name, car, test_mode=False):
    if test_mode:
        return True
    else:
        return train_is_new_func[route_name](car)


def car_array_is_new(route_name, arr, test_mode=False):
    if test_mode:
        return True
    else:
        return any(map(train_is_new_func[route_name], arr))
