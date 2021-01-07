import asyncio
import datetime
import pytz
import psycopg2
import psycopg2.extras

import server.mbta_api as mbta_api
from server.fleet import car_is_new
from server.routes import get_line_for_route
from server.routes import DEFAULT_ROUTE_IDS
from server.history.util import get_history_db_connection, HISTORY_TABLE_NAME


async def update_history(test_mode=False):
    routes = DEFAULT_ROUTE_IDS
    now = datetime.datetime.now(pytz.utc)
    eastern = pytz.timezone('US/Eastern')
    postgres_conn = get_history_db_connection()
    json = await mbta_api.vehicle_data_for_routes(routes, test_mode)
    # Transform all of the current vehicles into easy-to-use form
    vehicles_by_route = {x: [] for x in routes}
    seen_trip_ids = []
    for vehicle in json:
        try:
            route_name = vehicle["route"]
            if vehicle["tripId"] not in seen_trip_ids:
                # Dedup trip ids
                seen_trip_ids.append(vehicle["tripId"])
                vehicle_set = {
                    # This can be mixed old/new. Gets filtered before db insertion below
                    "cars": vehicle["label"].split("-")
                }

                vehicles_by_route[route_name].append(vehicle_set)
        except AttributeError:
            now_eastern = now.astimezone(eastern)
            print("[{}] vehicle error: {}".format(now_eastern, vehicle))
    # Add to PostgreSQL log
    with postgres_conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        # This is a little nasty, but we want to maintain independent db rows for each car in a series (for the green line, where it's mixed new/old)
        for route in routes:
            line = get_line_for_route(route)
            for vehicle in vehicles_by_route[route]:
                for car in vehicle["cars"]:
                    cursor.execute(
                        f"SELECT * from {HISTORY_TABLE_NAME} WHERE car = %s ORDER BY seen_start DESC LIMIT 1",
                        [car],
                    )
                    latest = cursor.fetchone()
                    # Update the current record
                    if latest and (now - latest["seen_end"]).seconds < 1200:
                        cursor.execute(
                            f"UPDATE {HISTORY_TABLE_NAME} SET seen_end = %s WHERE id = %s",
                            [now, latest["id"]],
                        )
                    else:
                        # Make a new record
                        cursor.execute(
                            f"INSERT INTO {HISTORY_TABLE_NAME} (line, car, seen_start, seen_end, is_new) values (%s, %s, %s, %s, %s)",
                            [
                                line,
                                car,
                                now,
                                now,
                                car_is_new(route, car),
                            ],
                        )
        postgres_conn.commit()


if __name__ == "__main__":
    asyncio.run(update_history())
