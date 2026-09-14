"""Tests for chalicelib/routes.py -- the Red Line branch derivation.

Red-A (Ashmont) and Red-B (Braintree) are this app's own invention; the MBTA API
only knows "Red". Every function here exists to translate between the two, and
the translation has a long history of off-by-one and typo regressions.
"""

import pytest

from chalicelib.routes import (
    DEFAULT_ROUTE_IDS,
    GREEN_ROUTE_IDS,
    derive_custom_direction_destinations,
    derive_custom_route_name,
    get_line_for_route,
    normalize_custom_route_ids,
    normalize_custom_route_name,
    stop_belongs_to_custom_route,
)


def vehicle(route_id, route_pattern_name=None, stop_id=None):
    """Build the minimal vehicle shape derive_custom_route_name reads."""
    built = {"route": {"id": route_id}}
    if route_pattern_name is not None:
        built["trip"] = {"route_pattern": {"name": route_pattern_name}}
    if stop_id is not None:
        built["stop"] = {"id": stop_id}
    return built


@pytest.mark.parametrize(
    "route_id,expected",
    [("Red-A", "Red"), ("Red-B", "Red"), ("Red", "Red"), ("Orange", "Orange"), ("Green-B", "Green-B")],
)
def test_normalize_custom_route_name(route_id, expected):
    assert normalize_custom_route_name(route_id) == expected


def test_normalize_custom_route_ids_collapses_red_branches():
    # Load-bearing: the upstream API rejects "Red-A" as a route filter value.
    assert normalize_custom_route_ids(["Red-A", "Red-B", "Orange"]) == {"Red", "Orange"}


def test_normalize_custom_route_ids_handles_the_default_set():
    assert normalize_custom_route_ids(DEFAULT_ROUTE_IDS) == {
        "Orange",
        "Blue",
        "Red",
        *GREEN_ROUTE_IDS,
    }


def test_derive_custom_route_name_uses_the_route_pattern_first():
    assert derive_custom_route_name(vehicle("Red", "Alewife - Ashmont")) == "Red-A"
    assert derive_custom_route_name(vehicle("Red", "Alewife - Braintree")) == "Red-B"


def test_derive_custom_route_name_falls_back_to_the_stop_id():
    # No trip at all -- the first `try` swallows the KeyError and we fall through
    # to matching against the Ashmont-branch platform ids.
    assert derive_custom_route_name(vehicle("Red", stop_id="70085")) == "Red-A"
    assert derive_custom_route_name(vehicle("Red", stop_id="70105")) == "Red-B"


def test_derive_custom_route_name_passes_other_lines_through():
    assert derive_custom_route_name(vehicle("Orange")) == "Orange"
    assert derive_custom_route_name(vehicle("Green-E", "Heath Street - Medford/Tufts")) == "Green-E"


def test_derive_custom_route_name_survives_a_red_vehicle_with_neither_signal():
    # Both `try` blocks fail; the function must still return something usable.
    assert derive_custom_route_name({"route": {"id": "Red"}}) == "Red"


@pytest.mark.parametrize(
    "custom_route,expected",
    [("Red-A", ["Ashmont", "Alewife"]), ("Red-B", ["Braintree", "Alewife"])],
)
def test_derive_custom_direction_destinations_for_red(custom_route, expected):
    upstream = {"direction_destinations": ["Ashmont/Braintree", "Alewife"]}
    assert derive_custom_direction_destinations(upstream, "Red", custom_route) == expected


def test_derive_custom_direction_destinations_passes_other_lines_through():
    upstream = {"direction_destinations": ["Forest Hills", "Oak Grove"]}
    assert derive_custom_direction_destinations(upstream, "Orange", "Orange") == [
        "Forest Hills",
        "Oak Grove",
    ]


@pytest.mark.parametrize(
    "stop_id,custom_route,expected",
    [
        # Braintree-branch stations belong to Red-B only.
        ("place-brntn", "Red-B", True),
        ("place-brntn", "Red-A", False),
        ("place-qamnl", "Red-A", False),
        ("place-nqncy", "Red-A", False),
        # Ashmont-branch stations belong to Red-A only.
        ("place-asmnl", "Red-A", True),
        ("place-asmnl", "Red-B", False),
        ("place-shmnl", "Red-B", False),
        # Trunk stations belong to both.
        ("place-alfcl", "Red-A", True),
        ("place-alfcl", "Red-B", True),
        ("place-jfk", "Red-A", True),
        ("place-jfk", "Red-B", True),
    ],
)
def test_stop_belongs_to_custom_route_for_red(stop_id, custom_route, expected):
    assert stop_belongs_to_custom_route(stop_id, custom_route, "Red") is expected


def test_stop_belongs_to_custom_route_is_always_true_off_the_red_line():
    assert stop_belongs_to_custom_route("place-ogmnl", "Orange", "Orange") is True


@pytest.mark.parametrize(
    "route,expected",
    [("Red-A", "Red"), ("Red-B", "Red"), ("Green-E", "Green"), ("Orange", "Orange"), ("Mattapan", "Mattapan")],
)
def test_get_line_for_route(route, expected):
    # last_seen.py keys its S3 payload by this, and the frontend reads those keys.
    assert get_line_for_route(route) == expected
