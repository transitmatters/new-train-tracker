red_is_new = lambda x: int(x) >= 1900 and int(x) <= 2151
green_is_new = lambda x: int(x) >= 3900 and int(x) <= 3924
orange_is_new = lambda x: int(x) >= 1400 and int(x) <= 1551

train_is_new_func = {
    "Red-A": red_is_new,
    "Red-B": red_is_new,
    "Orange": orange_is_new,
    "Green-B": green_is_new,
    "Green-C": green_is_new,
    "Green-D": green_is_new,
    "Green-E": green_is_new,
}

green_new_test = lambda x: True
train_is_new_func_test = {
    "Red-A": lambda x: True,
    "Red-B": lambda x: True,
    "Orange": lambda x: True,
    "Green-B": green_new_test,
    "Green-C": green_new_test,
    "Green-D": green_new_test,
    "Green-E": green_new_test,
}


def car_is_new(route_name, car, test_mode=False):
    if test_mode:
        return train_is_new_func_test[route_name](car)
    else:
        return train_is_new_func[route_name](car)


def car_array_is_new(route_name, arr, test_mode=False):
    if test_mode:
        return any(map(train_is_new_func_test[route_name], arr))
    else:
        return any(map(train_is_new_func[route_name], arr))
