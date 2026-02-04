import axios from 'axios';

// API URL - configurable via environment variable
// For IIS deployment, set REACT_APP_VERIFACT_API_URL in your .env or web.config
export const VERIFACT_API_URL = process.env.REACT_APP_VERIFACT_API_URL || 'https://ecf-test.api.verifact.com.do';

// Create axios instance with default config
const api = axios.create({
    baseURL: VERIFACT_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('verifact_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('verifact_token');
            localStorage.removeItem('verifact_refresh_token');
            localStorage.removeItem('verifact_user');
            localStorage.removeItem('verifact_company');
            localStorage.removeItem('verifact_token_expiry');
            
            // Redirect to login if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (email, password) => 
        api.post('/api/auth/login', { email, password }),
    
    // Add more auth endpoints as needed
    // refreshToken: (refreshToken) => 
    //     api.post('/api/auth/refresh', { refreshToken }),
};

// Certificados API
export const certificadosApi = {
    getAll: () => 
        api.get('/api/certificado/listado'),
    
    upload: (file, password) => {
        const formData = new FormData();
        formData.append('certificado', file);
        formData.append('password', password);
        return api.post('/api/certificado/subir', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

// Facturas API (placeholder for future implementation)
export const facturasApi = {
    // getAll: (params) => api.get('/api/facturas', { params }),
    // getById: (id) => api.get(`/api/facturas/${id}`),
    // create: (data) => api.post('/api/facturas', data),
    // update: (id, data) => api.put(`/api/facturas/${id}`, data),
    // delete: (id) => api.delete(`/api/facturas/${id}`),
};

// Clientes API (placeholder for future implementation)
export const clientesApi = {
    // getAll: (params) => api.get('/api/clientes', { params }),
    // getById: (id) => api.get(`/api/clientes/${id}`),
    // create: (data) => api.post('/api/clientes', data),
    // update: (id, data) => api.put(`/api/clientes/${id}`, data),
    // delete: (id) => api.delete(`/api/clientes/${id}`),
};

export default api;
