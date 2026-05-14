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

// Available environments
export const VERIFACT_ENVIRONMENTS = [
    { value: 'test', label: 'Test / Desarrollo', url: 'https://ecf-test.api.verifact.com.do' },
    { value: 'cert', label: 'Certificación', url: 'https://ecf-cert.api.verifact.com.do' },
    { value: 'prod', label: 'Producción', url: 'https://ecf.api.verifact.com.do' }
];

const DEFAULT_ENVIRONMENT = 'prod';
const ENV_STORAGE_KEY = 'verifact_environment';

// Install a global axios interceptor that injects the X-Verifact-Env header
// on every request. Reads the env from localStorage so it survives reloads.
axios.interceptors.request.use((config) => {
    try {
        const env = localStorage.getItem(ENV_STORAGE_KEY) || DEFAULT_ENVIRONMENT;
        config.headers = config.headers || {};
        config.headers['X-Verifact-Env'] = env;
    } catch (e) {
        // ignore storage errors (e.g. SSR)
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
        localStorage.setItem(ENV_STORAGE_KEY, env);
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
                // Update tokens in state and storage
                setToken(data.token);
                setRefreshTokenState(data.refreshToken);
                setTokenExpiry(new Date(data.expira));
                
                localStorage.setItem('verifact_token', data.token);
                localStorage.setItem('verifact_refresh_token', data.refreshToken);
                localStorage.setItem('verifact_token_expiry', data.expira);
                
                // Update axios default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                
                // Update user data if provided
                if (data.usuario) {
                    const sucursalObj = data.usuario.sucursal || null;
                    const tenantObj = data.usuario.tenant || null;
                    const userData = {
                        id: data.usuario.id,
                        email: data.usuario.email,
                        name: data.usuario.nombre,
                        role: data.usuario.rol,
                        avatar: null,
                        sucursal: sucursalObj,
                        sucursalId: data.usuario.sucursalId || sucursalObj?.id || null,
                        tenantId: data.usuario.tenantId || tenantObj?.id || null
                    };
                    const companyData = {
                        id: data.usuario.tenantId || tenantObj?.id || data.usuario.clienteId,
                        name: tenantObj?.nombre || data.usuario.clienteNombre || '',
                        rnc: tenantObj?.rnc || data.usuario.clienteRNC || '',
                        address: '',
                        phone: '',
                        email: data.usuario.email
                    };
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
            // Token is close to expiry, refresh immediately
            console.log('Token próximo a expirar, renovando ahora...');
            refreshAuthToken();
        }
    }, [refreshAuthToken]);

    useEffect(() => {
        // Check for stored auth data on mount
        const storedToken = localStorage.getItem('verifact_token');
        const storedRefreshToken = localStorage.getItem('verifact_refresh_token');
        const storedUser = localStorage.getItem('verifact_user');
        const storedCompany = localStorage.getItem('verifact_company');
        const storedTokenExpiry = localStorage.getItem('verifact_token_expiry');
        
        if (storedToken && storedUser && storedCompany) {
            const expiryDate = storedTokenExpiry ? new Date(storedTokenExpiry) : null;
            
            // Check if token is still valid
            if (expiryDate && expiryDate > new Date()) {
                setToken(storedToken);
                setRefreshTokenState(storedRefreshToken);
                setTokenExpiry(expiryDate);
                setUser(JSON.parse(storedUser));
                setCompany(JSON.parse(storedCompany));
                setIsAuthenticated(true);
                
                // Set default axios header
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                
                // Schedule token refresh
                scheduleTokenRefresh(expiryDate);
            } else if (storedRefreshToken) {
                // Token expired but we have refresh token, try to refresh
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
                // No valid tokens, clear storage
                clearAuthData();
            }
        }
        setIsLoading(false);
        
        // Cleanup on unmount
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [clearAuthData, scheduleTokenRefresh, refreshAuthToken]);

    const login = async (email, password, ambiente) => {
        setIsLoading(true);
        
        try {
            // Persist selected environment BEFORE the request so the
            // interceptor picks it up immediately for this and subsequent calls
            const envToUse = ambiente || environment || DEFAULT_ENVIRONMENT;
            if (ambiente) setEnvironment(ambiente);

            // Use proxy or direct API based on environment
            const loginUrl = USE_PROXY 
                ? `${API_BASE_URL}/auth/login`  // Proxy endpoint
                : `${API_BASE_URL}/api/auth/login`;  // Direct API endpoint
            
            const response = await axios.post(loginUrl, {
                email,
                password,
                ambiente: envToUse
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Verifact-Env': envToUse
                }
            });

            const data = response.data;

            if (data.success) {
                // Extract user data from response (handles both new and legacy shapes)
                const sucursalObj = data.usuario.sucursal || null;
                const tenantObj = data.usuario.tenant || null;
                const userData = {
                    id: data.usuario.id,
                    email: data.usuario.email,
                    name: data.usuario.nombre,
                    role: data.usuario.rol,
                    avatar: null,
                    sucursal: sucursalObj,
                    sucursalId: data.usuario.sucursalId || sucursalObj?.id || null,
                    tenantId: data.usuario.tenantId || tenantObj?.id || null
                };
                
                // Extract company data from response
                const companyData = {
                    id: data.usuario.tenantId || tenantObj?.id,
                    name: tenantObj?.nombre || data.usuario.clienteNombre || '',
                    rnc: tenantObj?.rnc || data.usuario.clienteRNC || '',
                    address: '',
                    phone: '',
                    email: data.usuario.email
                };

                const expiryDate = new Date(data.expira);

                // Save to state
                setUser(userData);
                setCompany(companyData);
                setToken(data.token);
                setRefreshTokenState(data.refreshToken);
                setTokenExpiry(expiryDate);
                setIsAuthenticated(true);
                
                // Save to localStorage
                localStorage.setItem('verifact_token', data.token);
                localStorage.setItem('verifact_refresh_token', data.refreshToken);
                localStorage.setItem('verifact_user', JSON.stringify(userData));
                localStorage.setItem('verifact_company', JSON.stringify(companyData));
                localStorage.setItem('verifact_token_expiry', data.expira);
                
                // Set default axios header for future requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                
                // Schedule automatic token refresh
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
                // Server responded with error
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
                // No response received
                errorMessage = 'No se pudo conectar con el servidor';
            }
            
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (companyData, userData, ambiente) => {
        setIsLoading(true);
        
        try {
            const envToUse = ambiente || environment || DEFAULT_ENVIRONMENT;
            // New endpoint uses /api/tenant/registrar
            const registerUrl = USE_PROXY 
                ? `${API_BASE_URL}/tenant/registrar`
                : `${API_BASE_URL}/api/tenant/registrar`;
            
            // Map form data to API expected format
            const requestData = {
                companyName: companyData.companyName,
                rnc: companyData.rnc.replace(/-/g, ''), // Remove dashes from RNC
                companyEmail: companyData.companyEmail,
                phone: companyData.phone || '',
                fiscalAddress: companyData.address || '',
                userFullName: userData.name,
                userEmail: userData.email,
                userPassword: userData.password,
                ambiente: envToUse
            };
            
            const response = await axios.post(registerUrl, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Verifact-Env': envToUse
                }
            });

            const data = response.data;

            if (data.success) {
                // Registration successful - redirect to login
                // The user needs to login with their new credentials
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

    const consultRNC = async (rnc, ambiente) => {
        try {
            const cleanRnc = (rnc || '').replace(/\D/g, '');
            if (!cleanRnc) return { success: false, error: 'RNC vacío' };

            const envToUse = ambiente || environment || DEFAULT_ENVIRONMENT;
            const url = USE_PROXY 
                ? `${API_BASE_URL}/rnc/consultar/${cleanRnc}`
                : `${API_BASE_URL}/api/rnc/consultar-rnc/${cleanRnc}`;
            
            const response = await axios.get(url, {
                headers: { 'X-Verifact-Env': envToUse }
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('RNC lookup error:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'No se pudo consultar el RNC' 
            };
        }
    };

    const logout = async () => {
        // Call logout API to invalidate session on server
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
                // Even if server logout fails, we still clear local data
                console.error('Error al cerrar sesión en servidor:', error);
            }
        }
        
        // Clear local state and storage
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
