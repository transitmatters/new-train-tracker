"""Tests for chalicelib/fleet.py -- which vehicles count as "new".

This is the core question the whole app exists to answer, and it is encoded as
five bare numeric ranges with no cross-check against anything else.
"""

import pytest

from chalicelib.fleet import vehicle_array_is_new, vehicle_is_new, vehicle_is_new_func
from chalicelib.mbta_api import CARRIAGE_AGES, determineVehicleYearBuilt
from chalicelib.routes import DEFAULT_ROUTE_IDS, GREEN_ROUTE_IDS, SILVER_ROUTE_IDS, get_line_for_route


@pytest.mark.parametrize(
    "route,car,expected",
    [
        # Red: CRRC 1900-2151.
        ("Red-A", "1899", False),
        ("Red-A", "1900", True),
        ("Red-B", "2151", True),
        ("Red-B", "2152", False),
        ("Red-A", "1800", False),  # a Type 2 from 1993-94
        # Orange: CRRC 1400-1551.
        ("Orange", "1399", False),
        ("Orange", "1400", True),
        ("Orange", "1551", True),
        ("Orange", "1552", False),
        # Green: CAF Type 9, 3900-3923.
        ("Green-B", "3899", False),
        ("Green-C", "3900", True),
        ("Green-D", "3923", True),
        ("Green-E", "3924", False),
        ("Green-B", "3800", False),  # a Type 8
        # Silver: BEBs 1294-1299.
        ("741", "1293", False),
        ("741", "1294", True),
        ("749", "1299", True),
        ("749", "1300", False),
    ],
)
def test_vehicle_is_new_boundaries(route, car, expected):
    assert vehicle_is_new(route, car) is expected


@pytest.mark.parametrize("car", ["0700", "0793", "0600"])
def test_no_blue_line_car_is_new(car):
    # The Blue Line has had no new-car delivery, so this must be unconditionally
    # False -- not a range that happens to be empty.
    assert vehicle_is_new("Blue", car) is False


@pytest.mark.parametrize("car", ["3072", "3265", "3234"])
def test_no_mattapan_car_is_new(car):
    assert vehicle_is_new("Mattapan", car) is False


def test_vehicle_array_is_new_is_true_if_any_car_is_new():
    # Consists are mixed in practice; one new car makes the set count as new.
    assert vehicle_array_is_new("Red-A", ["1800", "1900"]) is True
    assert vehicle_array_is_new("Red-A", ["1800", "1801"]) is False
    assert vehicle_array_is_new("Green-B", ["3900"]) is True


def test_every_route_the_app_requests_has_a_newness_test():
    """Every route id reachable from the frontend must be in the dispatch dict.

    A missing key is a KeyError inside vehicle_data_for_routes' per-vehicle
    `except Exception: continue`, which silently empties the map.
    """
    for route_id in [*DEFAULT_ROUTE_IDS, *SILVER_ROUTE_IDS, "Mattapan"]:
        assert route_id in vehicle_is_new_func, f"{route_id} has no newness test"


def test_every_new_car_has_a_known_year_built():
    """Invariant: if a car counts as new, we must be able to date it.

    fleet.py's ranges and mbta_api.CARRIAGE_AGES are maintained independently,
    and they drifted before: green_is_new accepted 3924 while CARRIAGE_AGES
    stopped at 3923, so that car showed as new with a year built of "N/A".

    The sweep deliberately covers the whole plausible car-number space rather
    than just the numbers CARRIAGE_AGES already knows about -- a drift of this
    kind is precisely a car that one side has and the other does not.
    """
    routes_with_age_data = [*DEFAULT_ROUTE_IDS, "Mattapan"]
    checked = 0
    for route_id in routes_with_age_data:
        line = get_line_for_route(route_id)
        assert line in CARRIAGE_AGES, f"{line} has no carriage age data"
        for car in range(0, 4500):
            if vehicle_is_new(route_id, car):
                assert determineVehicleYearBuilt(car, line) != "N/A", (
                    f"car {car} on {route_id} is new but has no build year"
                )
                checked += 1
    assert checked > 0, "invariant never exercised -- the ranges must have moved"


def test_green_line_branches_share_one_newness_test():
    assert {vehicle_is_new_func[route_id] for route_id in GREEN_ROUTE_IDS} == {vehicle_is_new_func["Green-B"]}
