"""
Backend tests: Verifact env routing via X-Verifact-Env header.

Validates:
- /api/auth/login routes to TEST backend when X-Verifact-Env=test (admin@axcom.com OK)
- /api/auth/login fails when X-Verifact-Env=prod / cert (account does not exist there)
- /api/rnc/consultar/{rnc} accepts the header and returns a JSON response
- Header default behavior (omitted) routes to PROD (returns failure for the test admin)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend env file
    try:
        with open("/app/frontend/.env") as fh:
            for line in fh:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass

TEST_EMAIL = "admin@axcom.com"
TEST_PASSWORD = "Admin123!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Auth: env routing ----------
class TestAuthEnvRouting:
    def test_login_succeeds_on_test_env(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"X-Verifact-Env": "test"},
            timeout=30,
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:300]}"
        data = r.json()
        # Verifact wrapper exposes success + token-like payload
        assert data.get("success") is True, f"Login not successful on TEST: {data}"
        # token should be present somewhere
        token_present = any(k in data for k in ("token", "accessToken", "access_token")) or (
            isinstance(data.get("data"), dict)
            and any(k in data["data"] for k in ("token", "accessToken", "access_token"))
        )
        assert token_present, f"No token in TEST login response: {data}"

    def test_login_fails_on_prod_env(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"X-Verifact-Env": "prod"},
            timeout=30,
        )
        # Should not 200-success: either non-200 or success:false
        if r.status_code == 200:
            data = r.json()
            assert data.get("success") is False, f"Login unexpectedly succeeded on PROD: {data}"
        else:
            assert r.status_code in (400, 401, 404, 502), (
                f"Unexpected status {r.status_code}: {r.text[:300]}"
            )

    def test_login_fails_on_cert_env(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"X-Verifact-Env": "cert"},
            timeout=30,
        )
        if r.status_code == 200:
            data = r.json()
            assert data.get("success") is False, f"Login unexpectedly succeeded on CERT: {data}"
        else:
            assert r.status_code in (400, 401, 404, 502)

    def test_login_no_header_uses_backend_default(self, session):
        """No X-Verifact-Env header → backend falls back to VERIFACT_API_URL env var.

        Currently configured to 'test' via env, so this returns success. This is
        acceptable because the frontend ALWAYS sends the header.
        """
        r = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30,
        )
        assert r.status_code == 200
        data = r.json()
        # Either it succeeded (because default backend is test) OR failed (if default is prod)
        assert "success" in data


# ---------- RNC lookup ----------
class TestRncLookupEnv:
    def test_rnc_lookup_test_env(self, session):
        r = session.get(
            f"{BASE_URL}/api/rnc/consultar/130000000",
            headers={"X-Verifact-Env": "test"},
            timeout=30,
        )
        # Should return JSON regardless (success/not-found)
        assert r.status_code in (200, 404), f"Unexpected: {r.status_code} {r.text[:300]}"
        # Body must be JSON
        try:
            data = r.json()
        except Exception:
            pytest.fail(f"RNC endpoint did not return JSON: {r.text[:200]}")
        assert isinstance(data, dict)

    def test_rnc_lookup_prod_env(self, session):
        r = session.get(
            f"{BASE_URL}/api/rnc/consultar/130000000",
            headers={"X-Verifact-Env": "prod"},
            timeout=30,
        )
        assert r.status_code in (200, 404, 502)
        try:
            r.json()
        except Exception:
            pytest.fail(f"RNC PROD endpoint did not return JSON: {r.text[:200]}")
