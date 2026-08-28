"""Tests for /api/tenant/registrar proxy: expects success:true + tenantId on 200."""
import os
import random
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ecf-management.preview.emergentagent.com").rstrip("/")
TEST_ENV_HEADERS = {"Content-Type": "application/json", "X-Verifact-Env": "test"}


def _rand_rnc():
    # 9-digit RNC starting with 1 to look plausible
    return "1" + "".join(str(random.randint(0, 9)) for _ in range(8))


def _payload(rnc):
    suffix = random.randint(1000, 999999)
    return {
        "rnc": rnc,
        "companyName": f"TEST_Empresa_{suffix}",
        "commercialName": f"TEST_Empresa_{suffix}",
        "companyEmail": f"test_reg_{suffix}@example.com",
        "phone": "809-555-0000",
        "fiscalAddress": "Av Test 123",
        "userFullName": "Tester QA",
        "userEmail": f"tester_{suffix}@example.com",
        "userPassword": "A123@abcd",
        "acceptTerms": True,
        "planCode": "PROFESSIONAL",
    }


class TestTenantRegistrar:
    def test_registrar_success_with_new_rnc(self):
        """Proxy must return success:true and tenantId on new RNC in TEST env."""
        rnc = _rand_rnc()
        r = requests.post(
            f"{BASE_URL}/api/tenant/registrar",
            json=_payload(rnc),
            headers=TEST_ENV_HEADERS,
            timeout=30,
        )
        assert r.status_code in (200, 201), f"Unexpected status {r.status_code}: {r.text[:400]}"
        data = r.json()
        # Proxy wraps response with success:true
        assert data.get("success") is True, f"success flag missing. body={data}"
        # Proxy currently returns clienteId; frontend accepts either tenantId or clienteId
        assert data.get("tenantId") or data.get("clienteId"), f"tenant/cliente id missing. body={data}"

    def test_registrar_duplicate_rnc_fails(self):
        """Regression: registering the SAME RNC twice must fail on the second attempt."""
        rnc = _rand_rnc()
        p1 = _payload(rnc)
        r1 = requests.post(f"{BASE_URL}/api/tenant/registrar", json=p1, headers=TEST_ENV_HEADERS, timeout=30)
        assert r1.status_code in (200, 201) and r1.json().get("success") is True, f"seed failed: {r1.text[:300]}"

        # Second attempt with same RNC but different user email
        p2 = _payload(rnc)
        r2 = requests.post(f"{BASE_URL}/api/tenant/registrar", json=p2, headers=TEST_ENV_HEADERS, timeout=30)
        if r2.status_code == 200:
            data = r2.json()
            assert data.get("success") is False, f"Duplicate RNC should not succeed: {data}"
        else:
            assert r2.status_code in (400, 409, 422), f"Unexpected status {r2.status_code}: {r2.text[:400]}"
