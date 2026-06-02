import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// API URL Configuration
// In production (IIS): Set REACT_APP_VERIFACT_API_URL to your API URL (requires CORS enabled)
// In preview: Uses local proxy to bypass CORS
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const VERIFACT_API_DIRECT = process.env.REACT_APP_VERIFACT_API_URL || 'https://ecf.api.verifact.com.do';

// Use proxy in preview, direct API in production
const USE_PROXY = BACKEND_URL && BACKEND_URL.includes('preview.emergentagent.com');
const API_BASE_URL = USE_PROXY ? `${BACKEND_URL}/api` : VERIFACT_API_DIRECT;

// Time before expiry to refresh token (5 minutes)
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;

// Available environments (test, cert, prod). Default is production.
export const VERIFACT_ENVIRONMENTS = [
    { value: 'prod', label: 'Producción', url: 'https://ecf.api.verifact.com.do' },
    { value: 'cert', label: 'Certificación', url: 'https://ecf-cert.api.verifact.com.do' },
    { value: 'test', label: 'Test / Desarrollo', url: 'https://ecf-test.api.verifact.com.do' },
];

const DEFAULT_ENVIRONMENT = 'prod';
const ENV_STORAGE_KEY = 'verifact_environment';

// Global axios interceptor — sends the active env on every request
axios.interceptors.request.use((config) => {
    try {
        const env = localStorage.getItem(ENV_STORAGE_KEY) || DEFAULT_ENVIRONMENT;
        config.headers = config.headers || {};
        config.headers['X-Verifact-Env'] = env;
    } catch (e) {
        // ignore
    }
    return config;
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [company, setCompany] = useState(null);
    const [token, setToken] = useState(null);
    const [refreshTokenState, setRefreshTokenState] = useState(null);
    const [tokenExpiry, setTokenExpiry] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [environment, setEnvironmentState] = useState(() => {
        try {
            return localStorage.getItem(ENV_STORAGE_KEY) || DEFAULT_ENVIRONMENT;
        } catch (e) {
            return DEFAULT_ENVIRONMENT;
        }
    });
    const refreshTimeoutRef = useRef(null);
    const isRefreshingRef = useRef(false);

    const setEnvironment = useCallback((env) => {
        if (!VERIFACT_ENVIRONMENTS.find(e => e.value === env)) return;
        try {
            localStorage.setItem(ENV_STORAGE_KEY, env);
        } catch (e) {
            // ignore
        }
        setEnvironmentState(env);
    }, []);

    const clearAuthData = useCallback(() => {
        localStorage.removeItem('verifact_token');
        localStorage.removeItem('verifact_refresh_token');
        localStorage.removeItem('verifact_user');
        localStorage.removeItem('verifact_company');
        localStorage.removeItem('verifact_token_expiry');
        delete axios.defaults.headers.common['Authorization'];
        
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = null;
        }
    }, []);

    const handleLogout = useCallback(() => {
        setUser(null);
        setCompany(null);
        setToken(null);
        setRefreshTokenState(null);
        setTokenExpiry(null);
        setIsAuthenticated(false);
        clearAuthData();
    }, [clearAuthData]);

    // Helper to map login/refresh user payload (new shape with tenant/sucursal objects)
    const mapUserPayload = (apiUser) => {
        const sucursalObj = apiUser.sucursal || null;
        const tenantObj = apiUser.tenant || null;
        const userData = {
            id: apiUser.id,
            email: apiUser.email,
            name: apiUser.nombre,
            role: apiUser.rol,
            avatar: null,
            sucursal: sucursalObj,
            sucursalId: apiUser.sucursalId || sucursalObj?.id || null,
            tenantId: apiUser.tenantId || tenantObj?.id || null
        };
        const companyData = {
            id: apiUser.tenantId || tenantObj?.id || apiUser.clienteId,
            name: tenantObj?.nombre || apiUser.clienteNombre || '',
            rnc: tenantObj?.rnc || apiUser.clienteRNC || '',
            address: '',
            phone: '',
            email: apiUser.email
        };
        return { userData, companyData };
    };

    // Function to refresh the authentication token
    const refreshAuthToken = useCallback(async () => {
        const storedRefreshToken = localStorage.getItem('verifact_refresh_token');
        const storedToken = localStorage.getItem('verifact_token');
        
        if (!storedRefreshToken || !storedToken || isRefreshingRef.current) {
            return false;
        }
        
        isRefreshingRef.current = true;
        
        try {
            const refreshUrl = USE_PROXY 
                ? `${API_BASE_URL}/auth/refresh`
                : `${API_BASE_URL}/api/auth/refresh`;
            
            const response = await axios.post(refreshUrl, {
                refreshToken: storedRefreshToken
            }, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;

            if (data.success) {
                setToken(data.token);
                setRefreshTokenState(data.refreshToken);
                setTokenExpiry(new Date(data.expira));
                
                localStorage.setItem('verifact_token', data.token);
                localStorage.setItem('verifact_refresh_token', data.refreshToken);
                localStorage.setItem('verifact_token_expiry', data.expira);
                
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                
                if (data.usuario) {
                    const { userData, companyData } = mapUserPayload(data.usuario);
                    setUser(userData);
                    setCompany(companyData);
                    localStorage.setItem('verifact_user', JSON.stringify(userData));
                    localStorage.setItem('verifact_company', JSON.stringify(companyData));
                }
                
                console.log('Token renovado exitosamente');
                isRefreshingRef.current = false;
                return true;
            } else {
                console.error('Error al renovar token:', data.message);
                handleLogout();
                isRefreshingRef.current = false;
                return false;
            }
        } catch (error) {
            console.error('Error al renovar token:', error);
            handleLogout();
            isRefreshingRef.current = false;
            return false;
        }
    }, [handleLogout]);

    // Schedule token refresh before expiry
    const scheduleTokenRefresh = useCallback((expiryDate) => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }
        
        const now = new Date().getTime();
        const expiry = new Date(expiryDate).getTime();
        const timeUntilRefresh = expiry - now - TOKEN_REFRESH_THRESHOLD;
        
        if (timeUntilRefresh > 0) {
            console.log(`Token refresh programado en ${Math.round(timeUntilRefresh / 1000 / 60)} minutos`);
            refreshTimeoutRef.current = setTimeout(async () => {
                console.log('Iniciando renovación automática de token...');
                await refreshAuthToken();
            }, timeUntilRefresh);
        } else if (expiry > now) {
            console.log('Token próximo a expirar, renovando ahora...');
            refreshAuthToken();
        }
    }, [refreshAuthToken]);

    useEffect(() => {
        const storedToken = localStorage.getItem('verifact_token');
        const storedRefreshToken = localStorage.getItem('verifact_refresh_token');
        const storedUser = localStorage.getItem('verifact_user');
        const storedCompany = localStorage.getItem('verifact_company');
        const storedTokenExpiry = localStorage.getItem('verifact_token_expiry');
        
        if (storedToken && storedUser && storedCompany) {
            const expiryDate = storedTokenExpiry ? new Date(storedTokenExpiry) : null;
            
            if (expiryDate && expiryDate > new Date()) {
                setToken(storedToken);
                setRefreshTokenState(storedRefreshToken);
                setTokenExpiry(expiryDate);
                setUser(JSON.parse(storedUser));
                setCompany(JSON.parse(storedCompany));
                setIsAuthenticated(true);
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                scheduleTokenRefresh(expiryDate);
            } else if (storedRefreshToken) {
                console.log('Token expirado, intentando renovar...');
                refreshAuthToken().then(success => {
                    if (success) {
                        const newExpiry = localStorage.getItem('verifact_token_expiry');
                        if (newExpiry) {
                            scheduleTokenRefresh(newExpiry);
                        }
                    }
                });
            } else {
                clearAuthData();
            }
        }
        setIsLoading(false);
        
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [clearAuthData, scheduleTokenRefresh, refreshAuthToken]);

    const login = async (email, password) => {
        setIsLoading(true);
        
        try {
            const loginUrl = USE_PROXY 
                ? `${API_BASE_URL}/auth/login`
                : `${API_BASE_URL}/api/auth/login`;
            
            const response = await axios.post(loginUrl, {
                email,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;

            if (data.success) {
                const { userData, companyData } = mapUserPayload(data.usuario);
                const expiryDate = new Date(data.expira);

                setUser(userData);
                setCompany(companyData);
                setToken(data.token);
                setRefreshTokenState(data.refreshToken);
                setTokenExpiry(expiryDate);
                setIsAuthenticated(true);
                
                localStorage.setItem('verifact_token', data.token);
                localStorage.setItem('verifact_refresh_token', data.refreshToken);
                localStorage.setItem('verifact_user', JSON.stringify(userData));
                localStorage.setItem('verifact_company', JSON.stringify(companyData));
                localStorage.setItem('verifact_token_expiry', data.expira);
                
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                scheduleTokenRefresh(expiryDate);
                
                return { success: true };
            } else {
                return { 
                    success: false, 
                    error: data.message || 'Credenciales inválidas' 
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Error al iniciar sesión';
            
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = 'Credenciales inválidas';
                } else if (error.response.status === 400) {
                    errorMessage = error.response.data?.message || 'Datos de inicio de sesión incorrectos';
                } else if (error.response.status === 500) {
                    errorMessage = 'Error en el servidor. Intente más tarde.';
                } else {
                    errorMessage = error.response.data?.message || 'Error al iniciar sesión';
                }
            } else if (error.request) {
                errorMessage = 'No se pudo conectar con el servidor';
            }
            
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (companyData, userData, acceptTerms = true) => {
        setIsLoading(true);
        
        try {
            const registerUrl = USE_PROXY 
                ? `${API_BASE_URL}/tenant/registrar`
                : `${API_BASE_URL}/api/tenant/registrar`;
            
            // Map form data to the API expected format (new tenant DTO).
            // commercialName mirrors companyName since the field is not shown in the UI.
            const companyName = (companyData.companyName || '').trim();
            const requestData = {
                rnc: companyData.rnc.replace(/-/g, ''),
                companyName: companyName,
                commercialName: companyName,
                companyEmail: companyData.companyEmail,
                phone: companyData.phone || '',
                fiscalAddress: companyData.address || '',
                userFullName: userData.name,
                userEmail: userData.email,
                userPassword: userData.password,
                acceptTerms: !!acceptTerms
            };
            
            const response = await axios.post(registerUrl, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;

            if (data.success) {
                return { 
                    success: true, 
                    message: 'Registro exitoso. Por favor inicia sesión con tus credenciales.',
                    requireLogin: true
                };
            } else {
                return { 
                    success: false, 
                    error: data.message || 'Error en el registro' 
                };
            }
        } catch (error) {
            console.error('Registration error:', error);
            
            let errorMessage = 'Error en el registro';
            
            if (error.response) {
                if (error.response.status === 400) {
                    errorMessage = error.response.data?.message || 'Datos de registro inválidos';
                } else if (error.response.status === 500) {
                    errorMessage = 'Error en el servidor. Intente más tarde.';
                } else {
                    errorMessage = error.response.data?.message || error.response.data?.detail || 'Error en el registro';
                }
            } else if (error.request) {
                errorMessage = 'No se pudo conectar con el servidor';
            }
            
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const consultRNC = async (rnc) => {
        try {
            const cleanRnc = (rnc || '').replace(/\D/g, '');
            if (!cleanRnc) return { success: false, error: 'RNC vacío' };

            const url = USE_PROXY 
                ? `${API_BASE_URL}/rnc/consultar/${cleanRnc}`
                : `${API_BASE_URL}/api/rnc/consultar-rnc/${cleanRnc}`;
            
            const response = await axios.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('RNC lookup error:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'No se pudo consultar el RNC' 
            };
        }
    };

    const loginStaff = async (user, password) => {
        setIsLoading(true);
        try {
            const url = USE_PROXY
                ? `${API_BASE_URL}/platform/auth/login`
                : `${API_BASE_URL}/api/platform/auth/login`;

            const response = await axios.post(url, {
                user,
                password,
            }, {
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/plain' }
            });

            const data = response.data;
            if (data.success) {
                const apiUser = data.usuario || {};
                const userData = {
                    id: apiUser.id,
                    email: apiUser.email,
                    username: apiUser.email, // platform uses 'admin' as both
                    name: apiUser.nombre || apiUser.email,
                    role: apiUser.rol || 'PlatformAdmin',
                    avatar: null,
                    isStaff: true,
                };
                const companyData = {
                    id: null,
                    name: 'Verifact · BackOffice',
                    rnc: '',
                    address: '',
                    phone: '',
                    email: apiUser.email,
                };
                const expiryDate = new Date(data.expira);

                setUser(userData);
                setCompany(companyData);
                setToken(data.token);
                setRefreshTokenState(data.refreshToken || null);
                setTokenExpiry(expiryDate);
                setIsAuthenticated(true);

                localStorage.setItem('verifact_token', data.token);
                if (data.refreshToken) {
                    localStorage.setItem('verifact_refresh_token', data.refreshToken);
                } else {
                    localStorage.removeItem('verifact_refresh_token');
                }
                localStorage.setItem('verifact_user', JSON.stringify(userData));
                localStorage.setItem('verifact_company', JSON.stringify(companyData));
                localStorage.setItem('verifact_token_expiry', data.expira);

                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                // Platform tokens may not have refresh; only schedule if a refresh token exists
                if (data.refreshToken) {
                    scheduleTokenRefresh(expiryDate);
                }
                return { success: true };
            }
            return { success: false, error: data.message || 'Credenciales inválidas' };
        } catch (error) {
            console.error('Platform login error:', error);
            let errorMessage = 'Error al iniciar sesión';
            if (error.response) {
                if (error.response.status === 401) errorMessage = 'Credenciales inválidas';
                else if (error.response.status === 400) errorMessage = error.response.data?.message || 'Datos incorrectos';
                else errorMessage = error.response.data?.message || `Error: ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'No se pudo conectar con el servidor';
            }
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        if (token) {
            try {
                const logoutUrl = USE_PROXY 
                    ? `${API_BASE_URL}/auth/logout`
                    : `${API_BASE_URL}/api/auth/logout`;
                
                await axios.post(logoutUrl, {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Sesión cerrada en el servidor');
            } catch (error) {
                console.error('Error al cerrar sesión en servidor:', error);
            }
        }
        
        handleLogout();
    };

    const value = {
        user,
        company,
        token,
        tokenExpiry,
        isLoading,
        isAuthenticated,
        environment,
        environments: VERIFACT_ENVIRONMENTS,
        setEnvironment,
        login,
        loginStaff,
        register,
        logout,
        refreshAuthToken,
        consultRNC,
        apiUrl: API_BASE_URL,
        useProxy: USE_PROXY
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
