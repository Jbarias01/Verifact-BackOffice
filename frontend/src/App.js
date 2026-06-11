import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from '@/components/ui/sonner';

// Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import StaffLogin from '@/pages/StaffLogin';
import StaffDashboard from '@/pages/StaffDashboard';
import ClientesEmpresas from '@/pages/ClientesEmpresas';
import DashboardPosMockup from '@/pages/mockups/DashboardPosMockup';
import PosSalesMockup from '@/pages/mockups/PosSalesMockup';
import Dashboard from '@/pages/Dashboard';
import Certificados from '@/pages/Certificados';
import Facturas from '@/pages/Facturas';
import Usuarios from '@/pages/Usuarios';
import Empresa from '@/pages/Empresa';
import Configuracion from '@/pages/Configuracion';
import RecepcionEcf from '@/pages/RecepcionEcf';
import Comprobantes from '@/pages/Comprobantes';
import EcfEmitidos from '@/pages/EcfEmitidos';
import EcfRecibidosReport from '@/pages/EcfRecibidosReport';
import Sucursales from '@/pages/Sucursales';
import Clientes from '@/pages/Clientes';
import Pos from '@/pages/Pos';

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout';

// Placeholder pages for routes
const PlaceholderPage = ({ title }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground max-w-md">
            Esta sección estará disponible próximamente. Estamos trabajando para traerte la mejor experiencia.
        </p>
    </div>
);

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/backoffice" element={<StaffLogin />} />
                        <Route path="/backoffice/dashboard" element={<StaffDashboard />} />
                        <Route path="/backoffice/clientes" element={<ClientesEmpresas />} />

                        {/* Mockup previews (design proposal) */}
                        <Route path="/mockup/dashboard" element={<DashboardPosMockup />} />
                        <Route path="/mockup/pos" element={<PosSalesMockup />} />

                        {/* POS — full screen (auth required, no DashboardLayout) */}
                        <Route path="/pos" element={<Pos />} />
                        
                        {/* Protected Dashboard Routes */}
                        <Route path="/dashboard" element={<DashboardLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="facturas" element={<Facturas />} />
                            <Route path="recepcion-ecf" element={<RecepcionEcf />} />
                            <Route path="clientes" element={<Clientes />} />
                            <Route path="emitidas" element={<PlaceholderPage title="Facturas Emitidas" />} />
                            <Route path="pendientes" element={<PlaceholderPage title="Facturas Pendientes" />} />
                            <Route path="comprobantes" element={<Comprobantes />} />
                            <Route path="certificados" element={<Certificados />} />
                            <Route path="usuarios" element={<Usuarios />} />
                            <Route path="reportes" element={<EcfEmitidos />} />
                            <Route path="reportes-recibidos" element={<EcfRecibidosReport />} />
                            <Route path="empresa" element={<Empresa />} />
                            <Route path="sucursales" element={<Sucursales />} />
                            <Route path="configuracion" element={<Configuracion />} />
                        </Route>
                        
                        {/* Default redirect */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </BrowserRouter>
                <Toaster position="top-right" />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
