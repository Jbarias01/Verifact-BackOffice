import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
    ShieldCheck, LogOut, Building2, Users, BarChart3, Layers,
    Globe, Mail, KeyRound, Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnvSwitcherModal } from '@/components/EnvSwitcherModal';
import { cn } from '@/lib/utils';

const ENV_DOT = {
    prod: 'bg-emerald-400',
    cert: 'bg-amber-400',
    test: 'bg-slate-400',
};

const StaffDashboard = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading, logout, token, tokenExpiry, environment, environments } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/backoffice" replace />;
    }

    if (!user?.isStaff) {
        // Tenant users shouldn't land here
        return <Navigate to="/dashboard" replace />;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/backoffice');
    };

    const envLabel = environments.find(e => e.value === environment)?.label || environment;
    const envUrl = environments.find(e => e.value === environment)?.url;
    const expiryText = tokenExpiry ? new Date(tokenExpiry).toLocaleString('es-DO') : '—';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
            <EnvSwitcherModal />

            {/* Top bar */}
            <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <ShieldCheck className="h-5 w-5 text-slate-900" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Verifact · Staff</h1>
                            <p className="text-[11px] text-slate-400 uppercase tracking-widest">BackOffice de administración</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge
                            variant="outline"
                            className="border-slate-700 bg-slate-900 text-slate-200 gap-1"
                            data-testid="staff-dashboard-env-badge"
                        >
                            <span className={cn("inline-block w-2 h-2 rounded-full", ENV_DOT[environment] || 'bg-slate-400')} />
                            {envLabel}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-slate-300 hover:text-amber-400"
                            data-testid="staff-logout-button"
                        >
                            <LogOut className="h-4 w-4 mr-1" />
                            Cerrar sesión
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                {/* Greeting */}
                <section className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-8" data-testid="staff-greeting-card">
                        <p className="text-amber-400/80 text-xs uppercase tracking-widest font-medium">Sesión iniciada</p>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
                            Bienvenido, <span className="text-amber-400">{user.name || user.email}</span>
                        </h2>
                        <p className="mt-3 text-slate-400 max-w-xl">
                            Estás operando como administrador de la plataforma. Desde aquí podrás gestionar
                            empresas (tenants), planes y métricas globales del SaaS Verifact.
                        </p>

                        <div className="mt-6 grid sm:grid-cols-3 gap-4">
                            <InfoItem icon={<Mail className="h-4 w-4" />} label="Usuario" value={user.email || '—'} testId="staff-info-user" />
                            <InfoItem icon={<KeyRound className="h-4 w-4" />} label="Rol" value={user.role} testId="staff-info-role" />
                            <InfoItem icon={<Globe className="h-4 w-4" />} label="Ambiente" value={envLabel} subValue={envUrl} testId="staff-info-env" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between" data-testid="staff-session-card">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Sesión</h3>
                            <p className="mt-3 text-xs text-slate-400">Token válido hasta</p>
                            <p className="mt-1 text-base text-white font-mono">{expiryText}</p>
                        </div>
                        <div className="mt-6 text-xs text-slate-500 space-y-1">
                            <p>Atajo · cambiar ambiente: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">F8</kbd></p>
                            <p className="break-all">
                                <span className="text-slate-600">JWT (truncado):</span>{' '}
                                <span className="font-mono text-slate-400">{token ? `${token.slice(0, 24)}…` : '—'}</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Module placeholders */}
                <section>
                    <div className="flex items-end justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Módulos disponibles</h3>
                        <span className="text-xs text-slate-500">Próximamente más funciones</span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ModuleCard
                            icon={<Building2 className="h-5 w-5" />}
                            title="Tenants"
                            description="Empresas registradas en la plataforma."
                            soon
                            testId="module-tenants"
                        />
                        <ModuleCard
                            icon={<Layers className="h-5 w-5" />}
                            title="Planes"
                            description="Catálogo de planes y suscripciones."
                            soon
                            testId="module-plans"
                        />
                        <ModuleCard
                            icon={<Users className="h-5 w-5" />}
                            title="Usuarios Staff"
                            description="Gestión de administradores."
                            soon
                            testId="module-staff-users"
                        />
                        <ModuleCard
                            icon={<BarChart3 className="h-5 w-5" />}
                            title="Métricas globales"
                            description="e-CF totales, ingresos, tenants activos."
                            soon
                            testId="module-metrics"
                        />
                    </div>
                </section>
            </main>
        </div>
    );
};

const InfoItem = ({ icon, label, value, subValue, testId }) => (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4" data-testid={testId}>
        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest">
            {icon}
            {label}
        </div>
        <p className="mt-2 text-white font-medium truncate">{value}</p>
        {subValue && <p className="mt-0.5 text-[11px] text-slate-500 font-mono truncate">{subValue}</p>}
    </div>
);

const ModuleCard = ({ icon, title, description, soon, testId }) => (
    <div
        className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-amber-500/40 transition-colors"
        data-testid={testId}
    >
        <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                {icon}
            </div>
            {soon && (
                <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px] uppercase tracking-wider">
                    Próximamente
                </Badge>
            )}
        </div>
        <h4 className="mt-4 text-white font-semibold">{title}</h4>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
    </div>
);

export default StaffDashboard;
