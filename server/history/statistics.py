import csv
import datetime
from server.s3 import download

BUCKET = "tm-mbta-performance"
CACHE = {}
CACHE_LAST_REFRESH_DAY = None
ROUTES = ["Red", "Orange"]
S3_KEY_NEW_TRAINS = "NewTrains/run_counts/{}.csv"


def download_history(route):
    key = S3_KEY_NEW_TRAINS.format(route)
    return download(BUCKET, key, compressed=False)


def get_cached_summaries():
    global CACHE
    global CACHE_LAST_REFRESH_DAY
    now = datetime.datetime.utcnow()
    todays_data_upload = now.replace(hour=10, minute=6, second=0, microsecond=0)
    if CACHE_LAST_REFRESH_DAY is None or (CACHE_LAST_REFRESH_DAY != now.date() and now > todays_data_upload):
        CACHE_LAST_REFRESH_DAY = now.date()
        for route in ROUTES:
            CACHE[route] = summarize(route)

    return CACHE


def summarize(route):
    csv_buffer = download_history(route).strip().splitlines(True)
    reader = csv.reader(csv_buffer)
    next(reader, None)  # Skip the csv header

    max = 0
    max_date = None

    for date, count in reader:
        if int(count) >= max:
            max = int(count)
            max_date = date

    return {
        "max": {
            "value": max,
            "on_date": max_date
        }
    }
