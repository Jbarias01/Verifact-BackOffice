import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

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
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check for stored auth data on mount
        const storedUser = localStorage.getItem('verifact_user');
        const storedCompany = localStorage.getItem('verifact_company');
        
        if (storedUser && storedCompany) {
            setUser(JSON.parse(storedUser));
            setCompany(JSON.parse(storedCompany));
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        // Simulated login - will be replaced with actual API call
        setIsLoading(true);
        
        try {
            // Mock successful login
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const mockUser = {
                id: '1',
                email: email,
                name: 'Usuario Demo',
                role: 'admin',
                avatar: null
            };
            
            const mockCompany = {
                id: '1',
                name: 'Empresa Demo S.R.L.',
                rnc: '123456789',
                address: 'Santo Domingo, República Dominicana',
                phone: '809-555-1234',
                email: 'contacto@empresademo.com.do'
            };

            setUser(mockUser);
            setCompany(mockCompany);
            setIsAuthenticated(true);
            
            localStorage.setItem('verifact_user', JSON.stringify(mockUser));
            localStorage.setItem('verifact_company', JSON.stringify(mockCompany));
            
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Credenciales inválidas' };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (companyData, userData) => {
        setIsLoading(true);
        
        try {
            // Mock registration - will be replaced with actual API call
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
            return { success: false, error: 'Error en el registro' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setCompany(null);
        setIsAuthenticated(false);
        localStorage.removeItem('verifact_user');
        localStorage.removeItem('verifact_company');
    };

    const value = {
        user,
        company,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
