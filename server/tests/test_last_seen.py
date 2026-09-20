"""Tests for chalicelib/last_seen.py -- the S3 payload the frontend reads.

This module writes last_seen.json to S3, and src/hooks/useLastSighting.ts
fetches that file directly from the static origin. There is no typed contract
between the two, so the shape asserted here is the only thing holding them
together.
"""

import json

import chalicelib.last_seen as last_seen
import chalicelib.mbta_api as mbta_api
import chalicelib.s3 as s3


class FakeS3:
    def __init__(self, existing=None, download_error=None):
        self.existing = existing
        self.download_error = download_error
        self.uploads = []

    def download(self, key, encoding="utf8", compressed=True):
        if self.download_error:
            raise self.download_error
        return json.dumps(self.existing)

    def upload(self, key, body, compress=True):
        self.uploads.append({"key": key, "body": body, "compress": compress})

    @property
    def last_payload(self):
        return json.loads(self.uploads[-1]["body"])


def install(monkeypatch, fake_s3, vehicles):
    monkeypatch.setattr(s3, "download", fake_s3.download)
    monkeypatch.setattr(s3, "upload", fake_s3.upload)

    async def fake_vehicle_data(route_ids):
        return vehicles

    monkeypatch.setattr(mbta_api, "vehicle_data_for_routes", fake_vehicle_data)


def vehicle(label, route, is_new):
    return {"label": label, "route": route, "isNewTrain": is_new}


def test_update_recent_sightings_writes_per_line_payload(monkeypatch):
    fake = FakeS3(download_error=Exception("no such key"))
    install(
        monkeypatch,
        fake,
        [vehicle("1900", "Red-B", True), vehicle("1800", "Red-A", False), vehicle("3900", "Green-C", True)],
    )

    last_seen.update_recent_sightings()

    payload = fake.last_payload
    # Keyed by line, not route: Red-B collapses to Red, Green-C to Green.
    assert set(payload) == {"Red", "Green"}
    assert payload["Red"]["car"] == "1900"
    assert payload["Green"]["car"] == "3900"
    # Timestamps are Eastern-local ISO strings; dayjs parses these on the client.
    assert payload["Red"]["time"].endswith(("-05:00", "-04:00"))


def test_update_recent_sightings_ignores_old_trains(monkeypatch):
    fake = FakeS3(download_error=Exception("no such key"))
    install(monkeypatch, fake, [vehicle("1800", "Red-A", False)])

    last_seen.update_recent_sightings()

    # Nothing new was seen, so nothing is written -- the previous sighting must
    # survive rather than being overwritten with an empty object.
    assert fake.uploads == []


def test_update_recent_sightings_preserves_other_lines(monkeypatch):
    fake = FakeS3(existing={"Orange": {"car": "1400", "time": "2026-01-01T00:00:00-05:00"}})
    install(monkeypatch, fake, [vehicle("1900", "Red-B", True)])

    last_seen.update_recent_sightings()

    payload = fake.last_payload
    assert payload["Orange"]["car"] == "1400"
    assert payload["Red"]["car"] == "1900"


def test_update_recent_sightings_writes_uncompressed(monkeypatch):
    # The frontend fetches this file directly over HTTP, so it must not be zlib'd.
    fake = FakeS3(download_error=Exception("no such key"))
    install(monkeypatch, fake, [vehicle("1900", "Red-B", True)])

    last_seen.update_recent_sightings()

    assert fake.uploads[-1]["key"] == "last_seen.json"
    assert fake.uploads[-1]["compress"] is False


def test_update_recent_sightings_survives_an_api_failure(monkeypatch):
    fake = FakeS3(download_error=Exception("no such key"))
    monkeypatch.setattr(s3, "download", fake.download)
    monkeypatch.setattr(s3, "upload", fake.upload)

    async def boom(route_ids):
        raise Exception("MBTA is down")

    monkeypatch.setattr(mbta_api, "vehicle_data_for_routes", boom)

    # Runs on a 10-minute cron; an upstream outage must not raise out of the
    # Lambda handler.
    last_seen.update_recent_sightings()
    assert fake.uploads == []
