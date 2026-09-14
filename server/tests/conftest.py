"""Shared pytest configuration for the backend suite.

The environment block below runs at import time, before any app module is
imported. That ordering is load-bearing:

  * chalicelib/secrets.py binds MBTA_V3_API_KEY at import time.
  * app.py branches on TM_CORS_HOST at import time, and registers the Datadog
    middleware when it is set -- so a developer with it exported in their shell
    would otherwise run a different code path than CI.
"""

import os

os.environ.setdefault("MBTA_V3_API_KEY", "test-key")
# Not strictly required (boto3 resolves us-east-1 on its own), but these make a
# stray S3 call fail fast instead of hanging on an instance-metadata timeout.
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
for leaked in ("TM_CORS_HOST", "PRIDE_TRAIN_CARS", "HOLIDAY_TRAIN_CARS"):
    os.environ.pop(leaked, None)

import json  # noqa: E402
from pathlib import Path  # noqa: E402

import json_api_doc  # noqa: E402
import pytest  # noqa: E402

import chalicelib.mbta_api as mbta_api  # noqa: E402

FIXTURE_DIR = Path(__file__).parent / "fixtures"


def load_raw(name):
    """Return a fixture as the raw JSON:API document the MBTA API would send."""
    with open(FIXTURE_DIR / f"{name}.json") as f:
        return json.load(f)


def load_parsed(name):
    """Return a fixture as getV3 would return it, with parsing left real.

    json-api-doc is unmaintained (last release 2020), so running the real
    parse() over realistic payloads is part of what these tests pin.
    """
    return json_api_doc.parse(load_raw(name))


class FakeGetV3:
    """Stand-in for mbta_api.getV3 that records how it was called.

    Every consumer looks getV3 up on the module at call time, so
    monkeypatch.setattr(mbta_api, "getV3", FakeGetV3(...)) intercepts cleanly.
    """

    def __init__(self, result=None, error=None):
        self.result = result
        self.error = error
        self.calls = []

    async def __call__(self, command, params={}, session=None, cache_ttl=None):
        self.calls.append({"command": command, "params": params, "cache_ttl": cache_ttl})
        if self.error is not None:
            raise self.error
        return self.result

    @property
    def last_params(self):
        return self.calls[-1]["params"]


@pytest.fixture(autouse=True)
def clear_mbta_caches():
    """Reset both module-level caches around every test.

    _cache (URL -> (data, expiry)) and _stale_cache (f"stops:{id}" -> data) are
    separate key spaces with different lifetimes; clear in place rather than
    rebinding so a test holding a local reference still sees the reset.
    """
    mbta_api._cache.clear()
    mbta_api._stale_cache.clear()
    yield
    mbta_api._cache.clear()
    mbta_api._stale_cache.clear()
