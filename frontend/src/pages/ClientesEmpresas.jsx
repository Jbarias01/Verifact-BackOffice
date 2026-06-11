import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Building2, Search, RefreshCw, Loader2, Mail,
    CheckCircle2, XCircle, Calendar, Hash, ShieldCheck, LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { EnvSwitcherModal } from '@/components/EnvSwitcherModal';
import { cn } from '@/lib/utils';

const ENV_DOT = {
    prod: 'bg-emerald-400',
    cert: 'bg-amber-400',
    test: 'bg-slate-400',
};

const formatRNC = (raw) => {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length === 9) return `${digits.slice(0, 3)}-${digits.slice(3, 8)}-${digits.slice(8)}`;
    if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
    return digits;
};

const formatDate = (iso) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('es-DO', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
};

const ClientesEmpresas = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading, logout, environment, environments, apiUrl, useProxy } = useAuth();

    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');

    const fetchTenants = async () => {
        setLoading(true);
        setError('');
        try {
            const url = useProxy
                ? `${apiUrl}/platform/tenants`
                : `${apiUrl}/api/platform/tenants`;
            const res = await axios.get(url);
            setTenants(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Tenants list error:', err);
            const status = err.response?.status;
            if (status === 401 || status === 403) {
                setError('Tu sesión expiró o no tienes permisos. Vuelve a iniciar sesión.');
            } else {
                setError(err.response?.data?.detail || err.response?.data?.message || 'No se pudo obtener la lista.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user?.isStaff) {
            fetchTenants();
        }
    }, [isAuthenticated, user?.isStaff]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return tenants;
        return tenants.filter(t =>
            (t.nombre || '').toLowerCase().includes(q) ||
            (t.nombreComercial || '').toLowerCase().includes(q) ||
            (t.rnc || '').toLowerCase().includes(q) ||
            (t.email || '').toLowerCase().includes(q),
        );
    }, [tenants, query]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
            </div>
        );
    }
    if (!isAuthenticated) return <Navigate to="/backoffice" replace />;
    if (!user?.isStaff) return <Navigate to="/dashboard" replace />;

    const activos = tenants.filter(t => t.esActivo).length;
    const inactivos = tenants.length - activos;

    const envLabel = environments.find(e => e.value === environment)?.label || environment;

    const handleLogout = async () => {
        await logout();
        navigate('/backoffice');
    };

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
                        <Badge variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 gap-1">
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

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
                <div>
                    <Link
                        to="/backoffice/dashboard"
                        className="text-xs text-slate-400 hover:text-amber-400 inline-flex items-center gap-1"
                        data-testid="back-to-staff-dashboard"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Volver al Dashboard Staff
                    </Link>
                    <h2 className="mt-3 text-3xl font-bold text-white flex items-center gap-3">
                        <Building2 className="h-7 w-7 text-amber-400" />
                        Clientes / Empresas
                    </h2>
                    <p className="text-slate-400 mt-1">
                        Empresas (tenants) registradas en la plataforma Verifact.
                    </p>
                </div>

                {/* KPIs */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <KpiCard label="Total" value={tenants.length} testId="kpi-total" />
                    <KpiCard label="Activas" value={activos} accent="emerald" testId="kpi-activas" />
                    <KpiCard label="Inactivas" value={inactivos} accent="rose" testId="kpi-inactivas" />
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre, RNC o email…"
                            className="pl-9 bg-slate-900/70 border-slate-800 text-slate-100 placeholder:text-slate-600"
                            data-testid="tenants-search-input"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTenants}
                        disabled={loading}
                        className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                        data-testid="tenants-refresh-button"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Recargar</span>
                    </Button>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" data-testid="tenants-error">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden" data-testid="tenants-table-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="text-slate-400 uppercase text-[11px] tracking-widest">RNC / Cédula</TableHead>
                                <TableHead className="text-slate-400 uppercase text-[11px] tracking-widest">Nombre Comercial</TableHead>
                                <TableHead className="text-slate-400 uppercase text-[11px] tracking-widest">Responsable</TableHead>
                                <TableHead className="text-slate-400 uppercase text-[11px] tracking-widest">Email</TableHead>
                                <TableHead className="text-slate-400 uppercase text-[11px] tracking-widest">Estado</TableHead>
                                <TableHead className="text-slate-400 uppercase text-[11px] tracking-widest">Creado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow className="border-slate-800">
                                    <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                        Cargando…
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow className="border-slate-800">
                                    <TableCell colSpan={6} className="py-12 text-center text-slate-500" data-testid="tenants-empty">
                                        {query ? 'Sin resultados para tu búsqueda.' : 'No hay empresas registradas todavía.'}
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(t => (
                                <TableRow key={t.id} className="border-slate-800 hover:bg-slate-800/40" data-testid={`tenant-row-${t.id}`}>
                                    <TableCell className="font-mono text-slate-200">
                                        <div className="inline-flex items-center gap-2">
                                            <Hash className="h-3.5 w-3.5 text-slate-500" />
                                            {formatRNC(t.rnc) || '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-white font-medium">{t.nombreComercial || '—'}</TableCell>
                                    <TableCell className="text-slate-300">{t.nombre || '—'}</TableCell>
                                    <TableCell className="text-slate-300">
                                        <div className="inline-flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 text-slate-500" />
                                            {t.email || '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {t.esActivo ? (
                                            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Activa
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30 gap-1">
                                                <XCircle className="h-3 w-3" />
                                                Inactiva
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-slate-400">
                                        <div className="inline-flex items-center gap-2 text-xs">
                                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                            {formatDate(t.fechaCreacion)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    );
};

const KpiCard = ({ label, value, accent, testId }) => {
    const accentClass = accent === 'emerald'
        ? 'text-emerald-400'
        : accent === 'rose'
        ? 'text-rose-400'
        : 'text-amber-400';
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5" data-testid={testId}>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={cn("mt-2 text-3xl font-bold", accentClass)}>{value}</p>
        </div>
    );
};

export default ClientesEmpresas;
