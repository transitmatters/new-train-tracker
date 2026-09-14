"""Tests for chalicelib/mbta_api.py -- the MBTA v3 client and its transforms.

Two layers, deliberately:

  * Consumer functions (vehicle_data_for_routes, stops_for_route, routes_info,
    trip_departure_predictions) are tested against a stubbed getV3. They look it
    up on the module at call time, so monkeypatch intercepts cleanly.
  * getV3 itself is tested against a real local aiohttp server. Mocking
    aiohttp's private internals instead would turn every automated aiohttp bump
    into a false red -- which is how test suites end up disabled.
"""

import time

import pytest
from aiohttp import web
from aiohttp.test_utils import TestServer

import chalicelib.mbta_api as mbta_api
from chalicelib.mbta_api import (
    determineVehicleYearBuilt,
    maybe_reverse,
    reverse_if_stops_out_of_order,
)
from tests.conftest import FakeGetV3, load_parsed, load_raw

# ---------------------------------------------------------------------------
# vehicle_data_for_routes -- the /trains response contract
# ---------------------------------------------------------------------------

# Mirrors the Train interface in src/types.ts. If a key is added or removed on
# either side without the other, this set is what catches it.
EXPECTED_VEHICLE_KEYS = {
    "vehicleId",
    "label",
    "route",
    "direction",
    "latitude",
    "longitude",
    "currentStatus",
    "stationId",
    "tripId",
    "isNewTrain",
    "isFourCar",
    "carriages",
    "updatedAt",
    "isPrideCar",
    "isHolidayCar",
    "speed",
    "yearBuilt",
}


async def test_vehicle_data_maps_api_response_to_frontend_shape(monkeypatch):
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=load_parsed("vehicles")))

    vehicles = await mbta_api.vehicle_data_for_routes(["Red-A", "Red-B", "Green-B", "Orange"])

    # Three of the four fixture vehicles survive; the fourth has no stop.
    assert len(vehicles) == 3
    by_id = {v["vehicleId"]: v for v in vehicles}

    red = by_id["R-5470E3F1"]
    assert set(red.keys()) == EXPECTED_VEHICLE_KEYS
    # Route pattern says "Alewife - Braintree", so this is the Braintree branch.
    assert red["route"] == "Red-B"
    assert red["stationId"] == "place-qamnl"  # from stop.parent_station.id
    assert red["tripId"] == "trip-red-1"
    assert red["isNewTrain"] is True
    assert red["isFourCar"] is False
    assert red["yearBuilt"] == "2019-27"  # oldest carriage is 1900
    assert red["currentStatus"] == "STOPPED_AT"
    assert red["speed"] == 0.0

    green = by_id["G-10040"]
    assert green["route"] == "Green-B"
    assert green["isNewTrain"] is True  # 3900 is a Type 9
    assert green["yearBuilt"] == "2018-20"
    assert green["direction"] == 1

    orange = by_id["O-547"]
    assert orange["isFourCar"] is True  # exactly four carriages
    assert orange["yearBuilt"] == "2018-25"
    assert orange["speed"] is None


async def test_vehicle_without_stop_is_skipped(monkeypatch):
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=load_parsed("vehicles")))

    vehicles = await mbta_api.vehicle_data_for_routes(["Green-C"])

    # Assert on the length, not just contents: vehicle_data_for_routes swallows
    # per-vehicle exceptions with `continue`, so every bug in it presents as a
    # silently missing train rather than an error.
    assert len(vehicles) == 3
    assert "G-NOSTOP" not in {v["vehicleId"] for v in vehicles}


async def test_vehicle_data_returns_empty_list_on_api_error(monkeypatch):
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(error=Exception("429 Too Many Requests")))

    assert await mbta_api.vehicle_data_for_routes(["Red-A"]) == []


async def test_vehicle_data_requests_only_normalized_routes(monkeypatch):
    fake = FakeGetV3(result=[])
    monkeypatch.setattr(mbta_api, "getV3", fake)

    await mbta_api.vehicle_data_for_routes(["Red-A", "Red-B", "Orange"])

    # Red-A/Red-B are ours, not the MBTA's -- the upstream API rejects them.
    assert set(fake.last_params["filter[route]"].split(",")) == {"Red", "Orange"}
    assert fake.calls[0]["cache_ttl"] == 10


async def test_vehicle_data_sends_deterministic_route_filter(monkeypatch):
    """The outbound filter[route] must not depend on set iteration order.

    normalize_custom_route_ids returns a set, so before this was sorted the
    joined string differed between processes -- making any assertion on it
    randomly flaky in CI, and producing a different upstream URL on every cold
    Lambda start.
    """
    fake = FakeGetV3(result=[])
    monkeypatch.setattr(mbta_api, "getV3", fake)

    await mbta_api.vehicle_data_for_routes(["Green-B", "Red-A", "Blue", "Orange", "Red-B"])

    assert fake.last_params["filter[route]"] == "Blue,Green-B,Orange,Red"


async def test_unknown_route_prefix_does_not_drop_the_vehicle(monkeypatch):
    """An unrecognised line must not delete the vehicle from the response.

    determineVehicleYearBuilt used to index CARRIAGE_AGES directly, raising
    KeyError -- and it is called inside a per-vehicle `except Exception:
    continue`, so a single unknown route prefix blanked the entire map with no
    error logged anywhere.
    """
    # fleet.py knows the Silver Line routes, but CARRIAGE_AGES has no "741" key.
    doc = load_parsed("vehicles")
    for vehicle in doc:
        vehicle["route"]["id"] = "741"
        vehicle["label"] = "1294"
        vehicle["carriages"] = [{"label": "1294", "occupancy_status": "NO_DATA_AVAILABLE"}]

    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=doc))

    vehicles = await mbta_api.vehicle_data_for_routes(["741"])
    assert len(vehicles) == 3
    assert all(v["yearBuilt"] == "N/A" for v in vehicles)
    assert all(v["isNewTrain"] is True for v in vehicles)


async def test_pride_flag_is_false_when_env_var_is_unset(monkeypatch):
    """An unset PRIDE_TRAIN_CARS must not match anything.

    "".split(",") is [""], so an empty-labelled carriage used to match.
    """
    monkeypatch.delenv("PRIDE_TRAIN_CARS", raising=False)
    monkeypatch.delenv("HOLIDAY_TRAIN_CARS", raising=False)

    doc = load_parsed("vehicles")
    doc[1]["carriages"] = [
        {"label": "", "occupancy_status": "NO_DATA_AVAILABLE"},
        {"label": "3900", "occupancy_status": "NO_DATA_AVAILABLE"},
    ]
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=doc))

    vehicles = await mbta_api.vehicle_data_for_routes(["Green-B"])
    green = next(v for v in vehicles if v["vehicleId"] == "G-10040")
    assert green["isPrideCar"] is False
    assert green["isHolidayCar"] is False


async def test_non_numeric_carriage_label_does_not_drop_the_vehicle(monkeypatch):
    """A carriage whose label will not parse must not delete the train.

    min(int(label) for ...) raised ValueError inside the per-vehicle
    `except Exception: continue`, so one odd label blanked the whole vehicle.
    """
    doc = load_parsed("vehicles")
    doc[1]["carriages"] = [
        {"label": "", "occupancy_status": "NO_DATA_AVAILABLE"},
        {"label": "3900", "occupancy_status": "NO_DATA_AVAILABLE"},
    ]
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=doc))

    vehicles = await mbta_api.vehicle_data_for_routes(["Green-B"])
    green = next(v for v in vehicles if v["vehicleId"] == "G-10040")
    # The numeric label still determines the age; the blank one is ignored.
    assert green["yearBuilt"] == "2018-20"


async def test_vehicle_with_no_parseable_carriage_labels_still_returned(monkeypatch):
    doc = load_parsed("vehicles")
    doc[1]["carriages"] = [{"label": "", "occupancy_status": "NO_DATA_AVAILABLE"}]
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=doc))

    vehicles = await mbta_api.vehicle_data_for_routes(["Green-B"])
    green = next(v for v in vehicles if v["vehicleId"] == "G-10040")
    assert green["yearBuilt"] == "N/A"


async def test_pride_flag_is_true_for_a_listed_car(monkeypatch):
    monkeypatch.setenv("PRIDE_TRAIN_CARS", "3900")
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=load_parsed("vehicles")))

    vehicles = await mbta_api.vehicle_data_for_routes(["Green-B"])
    green = next(v for v in vehicles if v["vehicleId"] == "G-10040")
    assert green["isPrideCar"] is True


# ---------------------------------------------------------------------------
# stops_for_route / routes_info -- stale-cache fallback
# ---------------------------------------------------------------------------


async def test_stops_for_route_filters_to_the_custom_branch(monkeypatch):
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=load_parsed("stops_red")))

    ashmont = await mbta_api.stops_for_route("Red-A")
    ids = [s["id"] for s in ashmont]

    assert "place-asmnl" in ids
    assert "place-brntn" not in ids
    assert "place-qamnl" not in ids
    # Ordering must survive: the frontend assigns station offsets by array index.
    assert ids[0] == "place-alfcl"
    assert ids[-1] == "place-asmnl"


async def test_stops_for_route_returns_stale_cache_on_error(monkeypatch):
    good = FakeGetV3(result=load_parsed("stops_red"))
    monkeypatch.setattr(mbta_api, "getV3", good)
    first = await mbta_api.stops_for_route("Red-B")
    assert first

    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(error=Exception("503")))
    assert await mbta_api.stops_for_route("Red-B") == first


async def test_stops_for_route_returns_empty_without_stale_cache(monkeypatch):
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(error=Exception("503")))

    assert await mbta_api.stops_for_route("Red-B") == []


async def test_routes_info_expands_red_branches(monkeypatch):
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=load_parsed("routes")))

    routes = await mbta_api.routes_info(["Red-A", "Red-B"])

    assert [r["id"] for r in routes] == ["Red-A", "Red-B"]
    assert routes[0]["directionDestinations"] == ["Ashmont", "Alewife"]
    assert routes[1]["directionDestinations"] == ["Braintree", "Alewife"]
    # Non-branch fields still come straight from the upstream route.
    assert routes[0]["directionNames"] == ["South", "North"]


async def test_routes_info_passes_non_red_destinations_through(monkeypatch):
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=load_parsed("routes")))

    routes = await mbta_api.routes_info(["Orange"])

    assert routes[0]["directionDestinations"] == ["Forest Hills", "Oak Grove"]


async def test_routes_info_returns_stale_cache_on_error(monkeypatch):
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=load_parsed("routes")))
    first = await mbta_api.routes_info(["Orange"])
    assert first

    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(error=Exception("503")))
    assert await mbta_api.routes_info(["Orange"]) == first


async def test_trip_departure_predictions_returns_null_string_on_error(monkeypatch):
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(error=Exception("503")))

    # The frontend's isValidPrediction type guard checks for exactly this
    # sentinel, so the string "null" is load-bearing, not a slip.
    assert await mbta_api.trip_departure_predictions("t1", "s1") == {"departure_time": "null"}


async def test_trip_departure_predictions_returns_departure_time(monkeypatch):
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(result=load_parsed("predictions")))

    result = await mbta_api.trip_departure_predictions("trip-red-1", "place-qamnl")
    assert result == {"departure_time": "2026-01-15T09:32:00-05:00"}


# ---------------------------------------------------------------------------
# Pure transforms
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "route,first,second",
    [
        ("Green-B", "Park Street", "Boylston"),
        ("Red-A", "Park Street", "Downtown Crossing"),
        ("Orange", "Oak Grove", "Wellington"),
        ("Blue", "Wonderland", "Bowdoin"),
    ],
)
def test_maybe_reverse_restores_expected_order(route, first, second):
    backwards = [{"name": second}, {"name": "Somewhere"}, {"name": first}]

    assert [s["name"] for s in maybe_reverse(backwards, route)] == [
        first,
        "Somewhere",
        second,
    ]


@pytest.mark.parametrize("route", ["Green-B", "Red-A", "Orange", "Blue"])
def test_maybe_reverse_leaves_correct_order_alone(route):
    stops = maybe_reverse([{"name": "Park Street"}, {"name": "Boylston"}], route)
    assert stops[0]["name"] == "Park Street"


def test_maybe_reverse_passes_unknown_routes_through():
    stops = [{"name": "Mattapan"}, {"name": "Ashmont"}]
    assert maybe_reverse(stops, "Mattapan") is stops


def test_reverse_if_stops_out_of_order_returns_input_when_names_are_missing():
    stops = [{"name": "Nowhere"}]
    assert reverse_if_stops_out_of_order(stops, "Park Street", "Boylston") is stops


@pytest.mark.parametrize(
    "car,line,expected",
    [
        # Boundaries of each declared range, and just outside them.
        (1900, "Red", "2019-27"),
        (2151, "Red", "2019-27"),
        (2152, "Red", "N/A"),
        (1500, "Red", "1969-70"),
        (1499, "Red", "N/A"),
        (1400, "Orange", "2018-25"),
        (1551, "Orange", "2018-25"),
        (1552, "Orange", "N/A"),
        (3900, "Green", "2018-20"),
        (3923, "Green", "2018-20"),
        (3924, "Green", "N/A"),
        (3072, "Mattapan", "1945-46"),
        (700, "Blue", "2007-09"),
    ],
)
def test_determine_vehicle_year_built_boundaries(car, line, expected):
    # Called with both str and int: the annotation says str, but
    # vehicle_data_for_routes passes the int from min(...) of the carriages.
    assert determineVehicleYearBuilt(car, line) == expected
    assert determineVehicleYearBuilt(str(car), line) == expected


def test_determine_vehicle_year_built_tolerates_an_unknown_line():
    assert determineVehicleYearBuilt(1294, "741") == "N/A"


# ---------------------------------------------------------------------------
# getV3 -- real HTTP against a local server
# ---------------------------------------------------------------------------


async def serve(handler, monkeypatch):
    """Start a local aiohttp server and point getV3's base URL at it."""
    app = web.Application()
    app.router.add_get("/{command}", handler)
    server = TestServer(app)
    await server.start_server()
    monkeypatch.setattr(mbta_api, "BASE_URL_V3", str(server.make_url("/")) + "{command}?{parameters}")
    return server


async def test_getV3_parses_jsonapi_and_sends_the_api_key(monkeypatch):
    seen = {}

    async def handler(request):
        seen["api_key"] = request.headers.get("x-api-key")
        seen["query"] = dict(request.query)
        return web.json_response(load_raw("routes"))

    monkeypatch.setenv("MBTA_V3_API_KEY", "a-real-key")
    server = await serve(handler, monkeypatch)
    try:
        result = await mbta_api.getV3("routes", {"filter[id]": "Red"})
    finally:
        await server.close()

    assert seen["api_key"] == "a-real-key"
    assert seen["query"] == {"filter[id]": "Red"}
    # json_api_doc.parse flattens attributes onto the object.
    assert [r["id"] for r in result] == ["Red", "Orange", "Green-B"]
    assert result[0]["direction_names"] == ["South", "North"]


async def test_getV3_raises_on_error_status(monkeypatch):
    async def handler(request):
        return web.json_response({"errors": [{"status": "429"}]}, status=429)

    server = await serve(handler, monkeypatch)
    try:
        # Callers rely on this raising: it is what triggers the stale-cache and
        # empty-list fallbacks in stops_for_route / vehicle_data_for_routes.
        with pytest.raises(Exception, match="429"):
            await mbta_api.getV3("vehicles", {})
    finally:
        await server.close()


async def test_getV3_caches_within_ttl(monkeypatch):
    calls = []

    async def handler(request):
        calls.append(1)
        return web.json_response(load_raw("routes"))

    server = await serve(handler, monkeypatch)
    try:
        await mbta_api.getV3("routes", {"filter[id]": "Red"}, cache_ttl=60)
        await mbta_api.getV3("routes", {"filter[id]": "Red"}, cache_ttl=60)
    finally:
        await server.close()

    assert len(calls) == 1


async def test_getV3_refetches_after_ttl_expiry(monkeypatch):
    calls = []

    async def handler(request):
        calls.append(1)
        return web.json_response(load_raw("routes"))

    server = await serve(handler, monkeypatch)
    try:
        await mbta_api.getV3("routes", {"filter[id]": "Red"}, cache_ttl=60)
        # Force expiry by rewriting the entry rather than sleeping.
        for key, (data, _expiry) in list(mbta_api._cache.items()):
            mbta_api._cache[key] = (data, time.time() - 1)
        await mbta_api.getV3("routes", {"filter[id]": "Red"}, cache_ttl=60)
    finally:
        await server.close()

    assert len(calls) == 2


async def test_getV3_does_not_cache_without_a_ttl(monkeypatch):
    calls = []

    async def handler(request):
        calls.append(1)
        return web.json_response(load_raw("routes"))

    server = await serve(handler, monkeypatch)
    try:
        await mbta_api.getV3("routes", {"filter[id]": "Red"})
        await mbta_api.getV3("routes", {"filter[id]": "Red"})
    finally:
        await server.close()

    assert len(calls) == 2
    assert mbta_api._cache == {}
