def filter_new(vehicle_array):
    return list(filter(lambda veh: veh["isNewTrain"], vehicle_array))


def filter_old(vehicle_array):
    return list(filter(lambda veh: not veh["isNewTrain"], vehicle_array))


def filter_route(line, vehicle_array):
    return list(filter(lambda veh: line in veh["route"], vehicle_array))
