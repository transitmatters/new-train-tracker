import asyncio
import MbtaApi
import datetime
import psycopg2
import psycopg2.extras
from Fleet import car_is_new
import secrets

DB_LOG_TABLE_NAME = 'newtrains_history'
routes = ['Red', 'Orange', 'Green-B', 'Green-C', 'Green-D', 'Green-E']


async def update_history():
    postgres_conn = psycopg2.connect(
        dbname=secrets.POSTGRES_DB, user=secrets.POSTGRES_USER)

    json = await MbtaApi.getV3(
        'vehicles',
        {
            'filter[route]': ','.join(routes),
            'include': 'stop',
        },
    )

    json = await MbtaApi.vehicle_data_for_routes(routes)
    # Transform all of the current vehicles into easy-to-use form
    vehicles_by_route = {x: [] for x in routes}
    seen_trip_ids = []
    for vehicle in json:
        try:
            route_name = vehicle['route']
            if vehicle['tripId'] not in seen_trip_ids:
                # Dedup trip ids
                seen_trip_ids.append(
                    vehicle['tripId'])
                vehicle_set = {
                    # This can be mixed old/new. Gets filtered before db insertion below
                    'cars': vehicle['label'].split('-')
                }

                vehicles_by_route[route_name].append(vehicle_set)
        except AttributeError:
            print('vehicle error: {}'.format(vehicle))
    # Add to PostgreSQL log
    with postgres_conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        # This is a little nasty, but we want to maintain independent db rows for each car in a series (for the green line, where it's mixed new/old)
        for route in routes:
            for vehicle in vehicles_by_route[route]:
                for car in vehicle['cars']:
                    if car_is_new(route, car):
                        cursor.execute(
                            "SELECT * from newtrains_history WHERE car = %s ORDER BY seen_start DESC LIMIT 1", [car])
                        latest = cursor.fetchone()
                        # Update the current record
                        if latest and (datetime.datetime.now() - latest['seen_end']).seconds < 1200:
                            cursor.execute("UPDATE newtrains_history SET seen_end = %s WHERE id = %s", [
                                           datetime.datetime.now(), latest['id']])
                        else:
                            # Make a new record
                            cursor.execute("INSERT INTO newtrains_history (route, car, seen_start, seen_end) values (%s, %s, %s, %s)", [
                                           route, car, datetime.datetime.now(), datetime.datetime.now()])
        postgres_conn.commit()

if __name__ == '__main__':
    asyncio.run(update_history())
