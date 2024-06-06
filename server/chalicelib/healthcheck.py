import json
from chalice import Response
import chalicelib.secrets as secrets


def run():
    checks = [
        lambda: len(secrets.MBTA_V3_API_KEY) > 0,
    ]

    for i in range(0, len(checks)):
        try:
            checks[i] = checks[i]()
        except Exception:
            checks[i] = False

    if all(checks):
        return Response(json.dumps({"status": "pass"}), mimetype="application/json", status=200)

    return Response(
        json.dumps(
            {
                "status": "fail",
                "check_failed": checks.index(False),
            }
        ),
        mimetype="application/json",
        status=500,
    )
