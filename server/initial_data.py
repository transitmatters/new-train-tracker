import asyncio
import subprocess
from server.mbta_api import routes_info, vehicle_data_for_routes, stops_for_route
from server.last_seen import get_recent_sightings_for_lines
from server.util import filter_new, filter_old, filter_route


def get_git_tag():
    return str(subprocess.check_output(["git", "describe", "--tags", "--abbrev=0"]))[2:-3]


def calc_stats(vehicle_array):
    totalGreen = filter_route("Green", vehicle_array)
    totalOrange = filter_route("Orange", vehicle_array)
    totalRed = filter_route("Red", vehicle_array)
    totalBlue = filter_route("Blue", vehicle_array)

    # intialize dictionary of stats
    vehicle_stats = {
        "Green": {
            "totalActive": len(totalGreen),
            "totalNew": len(filter_new(totalGreen)),
            "totalOld": len(filter_old(totalGreen)),
        },
        "Orange": {
            "totalActive": len(totalOrange),
            "totalNew": len(filter_new(totalOrange)),
            "totalOld": len(filter_old(totalOrange)),
        },
        "Red": {
            "totalActive": len(totalRed),
            "totalNew": len(filter_new(totalRed)),
            "totalOld": len(filter_old(totalRed)),
        },
        "Blue": {
            "totalActive": len(totalBlue),
            "totalNew": len(filter_new(totalBlue)),
            "totalOld": len(filter_old(totalBlue)),
        },
    }

    return vehicle_stats


# captures initial request data from MBTA API as well as server-side data such as git tags and static train data
# returns JSON of all data
async def initial_request_data(route_ids):
    routes, vehicle_data, *stops = await asyncio.gather(
        *[
            routes_info(route_ids),
            vehicle_data_for_routes(route_ids),
            *[stops_for_route(route_id) for route_id in route_ids],
        ]
    )
    sightings = get_recent_sightings_for_lines()
    git_tag = get_git_tag()
    return {
        "version": git_tag,
        "sightings": sightings,
        "routes": routes,
        "vehicles": vehicle_data,
        "vehicle_stats": calc_stats(vehicle_data),
        "stops": dict(zip(route_ids, stops)),
    }
