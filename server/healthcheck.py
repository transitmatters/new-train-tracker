import json
import os
import stat
import time
from flask import Response
import server.secrets as secrets
from server.last_seen import JSON_PATH as LAST_SEEN_JSON_PATH

def file_age_s(pathname):
    return time.time() - os.stat(pathname)[stat.ST_MTIME]

def run():
    checks = [
        lambda: len(secrets.MBTA_V3_API_KEY) > 0,
        lambda: file_age_s(LAST_SEEN_JSON_PATH) < 1800 # allow up to 30 minutes of outdated last_seen.json
    ]

    for i in range(0, len(checks)):
        try:
            checks[i] = checks[i]()
        except Exception:
            checks[i] = False

    if all(checks):
        return Response(json.dumps({
            "status": "pass"
        }), mimetype="application/json", status=200)

    return Response(json.dumps({
        "status": "fail",
        "check_failed": checks.index(False),
    }), mimetype="application/json", status=500)