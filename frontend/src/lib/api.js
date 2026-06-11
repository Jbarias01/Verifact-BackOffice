// Centralized helpers to resolve the active Verifact API base URL.
//
// In PREVIEW (Emergent agent) → all requests go through the FastAPI proxy at REACT_APP_BACKEND_URL.
// In PRODUCTION (deployed)    → requests go DIRECT to the .NET API of the selected environment.
//
// In both cases the active environment lives in localStorage under ENV_STORAGE_KEY
// (set by the F8 EnvSwitcherModal). This is read at REQUEST TIME so changing the
// environment via F8 takes effect immediately for every subsequent call.

export const VERIFACT_ENV_URLS = {
    prod: 'https://ecf.api.verifact.com.do',
    cert: 'https://ecf-cert.api.verifact.com.do',
    test: 'https://ecf-test.api.verifact.com.do',
};

export const DEFAULT_ENV = 'prod';
export const ENV_STORAGE_KEY = 'verifact_environment';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const USE_PROXY = !!(BACKEND_URL && BACKEND_URL.includes('preview.emergentagent.com'));

/** Returns the currently selected environment ('prod' | 'cert' | 'test') */
export const getActiveEnv = () => {
    try {
        const v = localStorage.getItem(ENV_STORAGE_KEY);
        if (v && VERIFACT_ENV_URLS[v]) return v;
    } catch (e) {
        // ignore
    }
    return DEFAULT_ENV;
};

/** Returns the direct (.NET) API base URL for the active environment */
export const getDirectApiBase = () => VERIFACT_ENV_URLS[getActiveEnv()] || VERIFACT_ENV_URLS[DEFAULT_ENV];

/**
 * Build a full URL for an API path.
 * @param {string} path Path WITHOUT leading slash, e.g. "auth/login" or "clientes/lista".
 * @param {object} [opts]
 * @param {string} [opts.directPath] Path to use when calling the .NET API directly
 *   (some endpoints have different paths between our proxy and the .NET, e.g.
 *   proxy "clientes/lista" → direct "api/clientes"). When omitted, defaults to "api/<path>".
 */
export const apiUrl = (path, opts = {}) => {
    const cleanPath = String(path || '').replace(/^\/+/, '');
    if (USE_PROXY) {
        return `${BACKEND_URL}/api/${cleanPath}`;
    }
    const direct = opts.directPath !== undefined
        ? String(opts.directPath).replace(/^\/+/, '')
        : `api/${cleanPath}`;
    return `${getDirectApiBase()}/${direct}`;
};

/** Returns the active /api base URL (without a trailing slash). */
export const apiBaseUrl = () => (USE_PROXY ? `${BACKEND_URL}/api` : `${getDirectApiBase()}/api`);
