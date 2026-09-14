"""Tests for app.py -- route registration, request plumbing, and cache headers.

IMPORTANT: every test in this file must be a plain `def`, never `async def`.
Each Chalice handler calls asyncio.run() internally, and pytest-asyncio's auto
mode would run an `async def` test inside a live event loop, making that
asyncio.run() raise "cannot be called from a running event loop".
"""

import json

from chalice.test import Client

import app as chalice_app
import chalicelib.mbta_api as mbta_api
import chalicelib.secrets as secrets


def test_all_routes_registered():
    """Importing app.py works and every public route is still wired up.

    This is the cheapest high-value test in the backend: `ruff check` never
    imports a module, so before this existed a dependency bump that broke
    `import app` could merge green and deploy straight to production.
    """
    assert set(chalice_app.app.routes) == {
        "/trains/{route_ids_string}",
        "/stops/{route_id}",
        "/routes/{route_ids_string}",
        "/predictions/{trip_id}/{stop_id}",
        "/healthcheck",
    }


def test_scheduled_last_seen_job_registered():
    """The cron that publishes last_seen.json is still attached to the app."""
    assert "update_last_seen" in chalice_app.app.handler_map


def test_trains_route_splits_ids_and_sets_cache_header(monkeypatch):
    received = {}

    async def fake_vehicle_data(route_ids):
        received["route_ids"] = route_ids
        return [{"vehicleId": "v1"}]

    monkeypatch.setattr(mbta_api, "vehicle_data_for_routes", fake_vehicle_data)

    with Client(chalice_app.app) as client:
        response = client.http.get("/trains/Red-A,Orange")

    assert received["route_ids"] == ["Red-A", "Orange"]
    assert json.loads(response.body) == [{"vehicleId": "v1"}]
    # Short cache: this exists to stop concurrent users each costing an API
    # Gateway request. Losing it is invisible until the bill arrives.
    assert response.headers["Cache-Control"] == "public, max-age=5"


def test_stops_route_sets_long_cache_header(monkeypatch):
    async def fake_stops(route_id):
        assert route_id == "Red-A"
        return [{"id": "place-alfcl"}]

    monkeypatch.setattr(mbta_api, "stops_for_route", fake_stops)

    with Client(chalice_app.app) as client:
        response = client.http.get("/stops/Red-A")

    assert json.loads(response.body) == [{"id": "place-alfcl"}]
    assert response.headers["Cache-Control"] == "public, max-age=604800"


def test_routes_route_splits_ids_and_sets_long_cache_header(monkeypatch):
    received = {}

    async def fake_routes_info(route_ids):
        received["route_ids"] = route_ids
        return [{"id": "Red-A"}]

    monkeypatch.setattr(mbta_api, "routes_info", fake_routes_info)

    with Client(chalice_app.app) as client:
        response = client.http.get("/routes/Red-A,Red-B")

    assert received["route_ids"] == ["Red-A", "Red-B"]
    assert response.headers["Cache-Control"] == "public, max-age=604800"


def test_predictions_route_passes_trip_and_stop(monkeypatch):
    received = {}

    async def fake_predictions(trip_id, stop_id):
        received.update(trip_id=trip_id, stop_id=stop_id)
        return {"departure_time": "2026-01-15T09:32:00-05:00"}

    monkeypatch.setattr(mbta_api, "trip_departure_predictions", fake_predictions)

    with Client(chalice_app.app) as client:
        response = client.http.get("/predictions/trip-red-1/place-qamnl")

    assert received == {"trip_id": "trip-red-1", "stop_id": "place-qamnl"}
    assert json.loads(response.body)["departure_time"] == "2026-01-15T09:32:00-05:00"
    assert response.headers["Cache-Control"] == "public, max-age=10"


def test_healthcheck_passes_with_an_api_key(monkeypatch):
    # healthcheck.run() reads secrets.MBTA_V3_API_KEY, which is bound at IMPORT
    # time -- so the module attribute must be patched. (getV3, by contrast,
    # re-reads os.environ at call time; monkeypatch.setenv is right there.)
    monkeypatch.setattr(secrets, "MBTA_V3_API_KEY", "a-real-key")

    with Client(chalice_app.app) as client:
        response = client.http.get("/healthcheck")

    assert response.status_code == 200
    assert json.loads(response.body) == {"status": "pass"}


def test_healthcheck_fails_without_an_api_key(monkeypatch):
    monkeypatch.setattr(secrets, "MBTA_V3_API_KEY", "")

    with Client(chalice_app.app) as client:
        response = client.http.get("/healthcheck")

    assert response.status_code == 500
    assert json.loads(response.body) == {"status": "fail", "check_failed": 0}
