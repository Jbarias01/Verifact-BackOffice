import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// API URL Configuration
// In production (IIS): Set REACT_APP_VERIFACT_API_URL to your API URL (requires CORS enabled)
// In preview: Uses local proxy to bypass CORS
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const VERIFACT_API_DIRECT = process.env.REACT_APP_VERIFACT_API_URL || 'https://ecf-test.api.verifact.com.do';

// Use proxy in preview, direct API in production
const USE_PROXY = BACKEND_URL && BACKEND_URL.includes('preview.emergentagent.com');
const API_BASE_URL = USE_PROXY ? `${BACKEND_URL}/api` : VERIFACT_API_DIRECT;

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
    const [refreshToken, setRefreshToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check for stored auth data on mount
        const storedToken = localStorage.getItem('verifact_token');
        const storedRefreshToken = localStorage.getItem('verifact_refresh_token');
        const storedUser = localStorage.getItem('verifact_user');
        const storedCompany = localStorage.getItem('verifact_company');
        const tokenExpiry = localStorage.getItem('verifact_token_expiry');
        
        if (storedToken && storedUser && storedCompany) {
            // Check if token is still valid
            if (tokenExpiry && new Date(tokenExpiry) > new Date()) {
                setToken(storedToken);
                setRefreshToken(storedRefreshToken);
                setUser(JSON.parse(storedUser));
                setCompany(JSON.parse(storedCompany));
                setIsAuthenticated(true);
                
                // Set default axios header
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } else {
                // Token expired, clear storage
                clearAuthData();
            }
        }
        setIsLoading(false);
    }, []);

    const clearAuthData = () => {
        localStorage.removeItem('verifact_token');
        localStorage.removeItem('verifact_refresh_token');
        localStorage.removeItem('verifact_user');
        localStorage.removeItem('verifact_company');
        localStorage.removeItem('verifact_token_expiry');
        delete axios.defaults.headers.common['Authorization'];
    };

    const login = async (email, password) => {
        setIsLoading(true);
        
        try {
            // Use proxy or direct API based on environment
            const loginUrl = USE_PROXY 
                ? `${API_BASE_URL}/auth/login`  // Proxy endpoint
                : `${API_BASE_URL}/api/auth/login`;  // Direct API endpoint
            
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
                // Extract user data from response
                const userData = {
                    id: data.usuario.id,
                    email: data.usuario.email,
                    name: data.usuario.nombre,
                    role: data.usuario.rol,
                    avatar: null
                };
                
                // Extract company data from response
                const companyData = {
                    id: data.usuario.clienteId,
                    name: data.usuario.clienteNombre,
                    rnc: data.usuario.clienteRNC,
                    address: '',
                    phone: '',
                    email: data.usuario.email
                };

                // Save to state
                setUser(userData);
                setCompany(companyData);
                setToken(data.token);
                setRefreshToken(data.refreshToken);
                setIsAuthenticated(true);
                
                // Save to localStorage
                localStorage.setItem('verifact_token', data.token);
                localStorage.setItem('verifact_refresh_token', data.refreshToken);
                localStorage.setItem('verifact_user', JSON.stringify(userData));
                localStorage.setItem('verifact_company', JSON.stringify(companyData));
                localStorage.setItem('verifact_token_expiry', data.expira);
                
                // Set default axios header for future requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                
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

    const register = async (companyData, userData) => {
        setIsLoading(true);
        
        try {
            // TODO: Implement registration endpoint when available
            // For now, we'll use mock registration
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const newUser = {
                id: Date.now().toString(),
                email: userData.email,
                name: userData.name,
                role: 'admin',
                avatar: null
            };
            
            const newCompany = {
                id: Date.now().toString(),
                name: companyData.companyName,
                rnc: companyData.rnc,
                address: companyData.address,
                phone: companyData.phone,
                email: companyData.companyEmail
            };

            setUser(newUser);
            setCompany(newCompany);
            setIsAuthenticated(true);
            
            localStorage.setItem('verifact_user', JSON.stringify(newUser));
            localStorage.setItem('verifact_company', JSON.stringify(newCompany));
            
            return { success: true };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Error en el registro' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setCompany(null);
        setToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);
        clearAuthData();
    };

    // Function to refresh token (can be used for token renewal)
    const refreshAuthToken = async () => {
        if (!refreshToken) return false;
        
        try {
            // TODO: Implement refresh token endpoint when available
            // const response = await axios.post(`${API_URL}/auth/refresh`, {
            //     refreshToken
            // });
            // Handle response...
            return true;
        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
            return false;
        }
    };

    const value = {
        user,
        company,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshAuthToken,
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
