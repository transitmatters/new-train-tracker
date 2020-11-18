from functools import reduce
import psycopg2.extras

from server.history.util import get_history_db_connection, HISTORY_TABLE_NAME


def choose_between_sightings(best, next):
    if not best:
        return next
    if next["seen_end"] > best["seen_end"]:
        return next
    return best


def get_recent_sightings_for_lines(test_mode=False):
    cxn = get_history_db_connection()
    with cxn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
        cursor.execute(
            f"SELECT * FROM {HISTORY_TABLE_NAME} WHERE (%s OR is_new=true)", [test_mode]
        )
        rows = cursor.fetchall()
    res = {}
    for line in ("Orange", "Red", "Green"):
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
