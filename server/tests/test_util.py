"""Tests for chalicelib/util.py."""

from chalicelib.util import filter_new


def test_filter_new_keeps_only_new_trains():
    vehicles = [
        {"label": "1900", "isNewTrain": True},
        {"label": "1800", "isNewTrain": False},
    ]
    assert [v["label"] for v in filter_new(vehicles)] == ["1900"]


def test_filter_new_of_an_empty_list():
    assert filter_new([]) == []
