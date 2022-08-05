from functools import reduce
import psycopg2.extras

from server.history.util import get_history_db_connection, HISTORY_TABLE_NAME
from server.secrets import POSTGRES_ENABLED

LINES = ["Orange", "Red", "Green", "Blue"]


def choose_between_sightings(best, next):
    if not best:
        return next
    if next["seen_end"] > best["seen_end"]:
        return next
    return best


# Get the last time that a new train was seen on each line
# If the POSTGRES_ENABLED flag is True, query the database, otherwise generate test data
def get_recent_sightings_for_lines(test_mode=False):
    res = {}
    if not POSTGRES_ENABLED:
        return res
    cxn = get_history_db_connection()
    with cxn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        cursor.execute(
            f"SELECT * FROM {HISTORY_TABLE_NAME} WHERE (%s OR is_new=true)", [test_mode]
        )
        rows = cursor.fetchall()
    for line in LINES:
        most_recent_sighting = reduce(
            choose_between_sightings,
            filter(lambda row: row["line"] == line, rows),
            None,
        )
        if most_recent_sighting:
            res[line] = {
                "car": most_recent_sighting["car"],
                "time": most_recent_sighting["seen_end"],
            }
    return res
