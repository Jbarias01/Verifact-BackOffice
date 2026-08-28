import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { apiUrl, USE_PROXY, ENV_STORAGE_KEY, DEFAULT_ENV, apiBaseUrl } from '@/lib/api';

const AuthContext = createContext(null);

// Time before expiry to refresh token (5 minutes)
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;

// Available environments (test, cert, prod). Default is production.
export const VERIFACT_ENVIRONMENTS = [
    { value: 'prod', label: 'Producción', url: 'https://ecf.api.verifact.com.do' },
    { value: 'cert', label: 'Certificación', url: 'https://ecf-cert.api.verifact.com.do' },
    { value: 'test', label: 'Test / Desarrollo', url: 'https://ecf-test.api.verifact.com.do' },
];

const DEFAULT_ENVIRONMENT = DEFAULT_ENV;

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
            const refreshUrl = apiUrl('auth/refresh');
            
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
            const loginUrl = apiUrl('auth/login');
            
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

    const register = async (companyData, userData, acceptTerms = true, planCode = null) => {
        setIsLoading(true);
        
        try {
            const registerUrl = apiUrl('tenant/registrar');
            
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
                acceptTerms: !!acceptTerms,
            };
            if (planCode) requestData.planCode = planCode;
            
            const response = await axios.post(registerUrl, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;

            // Success is either:
            //  - proxy path (preview): backend wraps as { success: true, ... }
            //  - direct path (production): .NET returns { tenantId, clienteRNC, usuarioId, usuarioEmail }
            // Any HTTP 200/201 with tenantId (or explicit success:true) counts as success.
            const httpOk = response.status >= 200 && response.status < 300;
            const looksLikeSuccess = data && (data.success === true || !!data.tenantId || !!data.clienteId);

            if (httpOk && looksLikeSuccess) {
                return {
                    success: true,
                    message: 'Registro exitoso.',
                    tenantId: data.tenantId || data.clienteId,
                    usuarioEmail: data.usuarioEmail,
                };
            } else {
                return {
                    success: false,
                    error: data?.message || data?.error || data?.detail || data?.title || 'Error en el registro',
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

            const url = apiUrl(`rnc/consultar/${cleanRnc}`, { directPath: `api/rnc/consultar-rnc/${cleanRnc}` });
            
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
            const url = apiUrl('platform/auth/login');

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

    const fetchPlanes = async () => {
        try {
            const url = apiUrl('planes');
            const res = await axios.get(url);
            return { success: true, data: Array.isArray(res.data) ? res.data : [] };
        } catch (error) {
            console.error('Planes fetch error:', error);
            return {
                success: false,
                error: error.response?.data?.detail || error.response?.data?.message || 'No se pudieron cargar los planes',
            };
        }
    };

    const logout = async () => {
        if (token) {
            try {
                const logoutUrl = apiUrl('auth/logout');
                
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
        fetchPlanes,
        apiUrl: apiBaseUrl(),
        useProxy: USE_PROXY
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
