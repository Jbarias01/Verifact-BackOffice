import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    FileText, 
    FileCheck, 
    Inbox, 
    Send,
    Shield,
    Receipt,
    Calendar,
    RefreshCw,
    Loader2,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Building2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import axios from 'axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area,
    ComposedChart,
    Line
} from 'recharts';

// API URL Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const VERIFACT_API_DIRECT = process.env.REACT_APP_VERIFACT_API_URL || 'https://ecf-test.api.verifact.com.do';
const USE_PROXY = BACKEND_URL && BACKEND_URL.includes('preview.emergentagent.com');
const API_BASE_URL = USE_PROXY ? `${BACKEND_URL}/api` : VERIFACT_API_DIRECT;

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

// Helper to format short currency for charts
const formatShortCurrency = (amount) => {
    if (amount >= 1000000) {
        return `RD$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `RD$${(amount / 1000).toFixed(0)}K`;
    }
    return `RD$${amount}`;
};

// Tipo eCF mapping with full names
const tipoEcfMap = {
    '31': 'Crédito Fiscal',
    '32': 'Consumo',
    '33': 'Nota Débito',
    '34': 'Nota Crédito',
    '41': 'Compras',
    '43': 'Gastos Menores',
    '44': 'Reg. Especiales',
    '45': 'Gubernamental',
    '46': 'Exportación',
    '47': 'Pagos Exterior'
};

// Order for NCF types
const ncfTypeOrder = ['31', '32', '33', '34', '41', '43', '44', '45', '46', '47'];

// Colors for charts
const CHART_COLORS = {
    primary: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    accent: '#8b5cf6',
    muted: '#6b7280'
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Dashboard = () => {
    const { user, company, token } = useAuth();
    const navigate = useNavigate();
    
    // State for real data
    const [isLoading, setIsLoading] = useState(true);
    const [ecfEmitidos, setEcfEmitidos] = useState([]);
    const [ecfRecibidos, setEcfRecibidos] = useState([]);
    const [comprobantes, setComprobantes] = useState([]);
    const [certificados, setCertificados] = useState([]);
    const [error, setError] = useState(null);

    const currentDate = new Date().toLocaleDateString('es-DO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Fetch all dashboard data
    const fetchDashboardData = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        setError(null);

        try {
            // Fetch eCF Emitidos
            try {
                const url = USE_PROXY 
                    ? `${API_BASE_URL}/ecf/emitidos`
                    : `${API_BASE_URL}/api/ecf/emitidos`;
                const emitidosRes = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (emitidosRes.data?.facturas) {
                    setEcfEmitidos(emitidosRes.data.facturas);
                }
            } catch (e) {
                console.log('eCF Emitidos endpoint not available', e);
            }

            // Fetch eCF Recibidos
            try {
                const url = USE_PROXY 
                    ? `${API_BASE_URL}/fe/recepcion/ecf/recibidos/filtros`
                    : `${API_BASE_URL}/fe/recepcion/api/ecf/recibidos`;
                const recibidosRes = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (recibidosRes.data?.ecfRecibidos) {
                    setEcfRecibidos(recibidosRes.data.ecfRecibidos);
                }
            } catch (e) {
                console.log('eCF Recibidos endpoint not available', e);
            }

            // Fetch Comprobantes
            try {
                const url = USE_PROXY 
                    ? `${API_BASE_URL}/comprobantes/cliente`
                    : `${API_BASE_URL}/api/comprobantes/cliente`;
                const comprobantesRes = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (Array.isArray(comprobantesRes.data)) {
                    setComprobantes(comprobantesRes.data);
                }
            } catch (e) {
                console.log('Comprobantes endpoint not available', e);
            }

            // Fetch Certificados
            try {
                const url = USE_PROXY 
                    ? `${API_BASE_URL}/certificado/listado`
                    : `${API_BASE_URL}/api/certificado/listado`;
                const certificadosRes = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (Array.isArray(certificadosRes.data)) {
                    setCertificados(certificadosRes.data);
                }
            } catch (e) {
                console.log('Certificados endpoint not available', e);
            }

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Error al cargar los datos del dashboard');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Sort comprobantes by tipo
    const sortedComprobantes = useMemo(() => {
        return [...comprobantes].sort((a, b) => {
            const indexA = ncfTypeOrder.indexOf(a.tipoeCF);
            const indexB = ncfTypeOrder.indexOf(b.tipoeCF);
            return indexA - indexB;
        });
    }, [comprobantes]);

    // Calculate statistics
    const stats = useMemo(() => ({
        // eCF Emitidos
        totalEmitidos: ecfEmitidos.length,
        montoEmitidos: ecfEmitidos.reduce((sum, e) => sum + (e.monto || 0), 0),
        emitidosAceptados: ecfEmitidos.filter(e => e.estado === 'Aceptado').length,
        emitidosEnCola: ecfEmitidos.filter(e => !e.estado).length,
        
        // eCF Recibidos
        totalRecibidos: ecfRecibidos.length,
        montoRecibidos: ecfRecibidos.reduce((sum, e) => sum + (e.montoTotal || 0), 0),
        
        // Comprobantes
        totalComprobantes: comprobantes.length,
        comprobantesHabilitados: comprobantes.filter(c => c.habilitado).length,
        
        // Certificados
        totalCertificados: certificados.length,
        certificadosActivos: certificados.filter(c => c.estado === 'Activo' || c.esActivo).length
    }), [ecfEmitidos, ecfRecibidos, comprobantes, certificados]);

    // Chart data - Emitidos vs Recibidos
    const emitidosVsRecibidosData = useMemo(() => [
        {
            name: 'Emitidos',
            cantidad: stats.totalEmitidos,
            monto: stats.montoEmitidos,
            fill: CHART_COLORS.primary
        },
        {
            name: 'Recibidos',
            cantidad: stats.totalRecibidos,
            monto: stats.montoRecibidos,
            fill: CHART_COLORS.success
        }
    ], [stats]);

    // Chart data - eCF by tipo (emitidos)
    const ecfByTipoData = useMemo(() => {
        const tipoCount = {};
        ecfEmitidos.forEach(ecf => {
            const tipo = ecf.e_NCF?.substring(1, 3) || 'Otro';
            tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
        });
        ecfRecibidos.forEach(ecf => {
            const tipo = ecf.tipoECF || 'Otro';
            tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
        });
        
        return Object.entries(tipoCount).map(([tipo, count], index) => ({
            name: tipoEcfMap[tipo] || `Tipo ${tipo}`,
            value: count,
            tipo: tipo
        }));
    }, [ecfEmitidos, ecfRecibidos]);

    // Chart data - Comprobantes status
    const comprobantesStatusData = useMemo(() => [
        {
            name: 'Habilitados',
            value: stats.comprobantesHabilitados,
            fill: CHART_COLORS.success
        },
        {
            name: 'Deshabilitados',
            value: stats.totalComprobantes - stats.comprobantesHabilitados,
            fill: CHART_COLORS.muted
        }
    ], [stats]);

    // Chart data - Ventas por tipo de comprobante (solo emitidos = ventas)
    const ventasPorTipoData = useMemo(() => {
        const tipoData = {};
        
        // Agrupar ventas (emitidos) por tipo
        ecfEmitidos.forEach(ecf => {
            const tipo = ecf.e_NCF?.substring(1, 3) || 'Otro';
            if (!tipoData[tipo]) {
                tipoData[tipo] = { cantidad: 0, monto: 0 };
            }
            tipoData[tipo].cantidad += 1;
            tipoData[tipo].monto += ecf.monto || 0;
        });
        
        // Convertir a array ordenado por tipo
        return ncfTypeOrder
            .filter(tipo => tipoData[tipo])
            .map(tipo => ({
                tipo: tipo,
                name: tipoEcfMap[tipo] || `Tipo ${tipo}`,
                shortName: tipo,
                cantidad: tipoData[tipo].cantidad,
                monto: tipoData[tipo].monto
            }));
    }, [ecfEmitidos]);

    // Chart data - Ventas por cliente/receptor
    const ventasPorClienteData = useMemo(() => {
        const clienteData = {};
        
        ecfEmitidos.forEach(ecf => {
            const cliente = ecf.razonSocialComprador || ecf.rncComprador || 'Sin identificar';
            const clienteKey = cliente.substring(0, 20) + (cliente.length > 20 ? '...' : '');
            if (!clienteData[clienteKey]) {
                clienteData[clienteKey] = { cantidad: 0, monto: 0, fullName: cliente };
            }
            clienteData[clienteKey].cantidad += 1;
            clienteData[clienteKey].monto += ecf.monto || 0;
        });
        
        return Object.entries(clienteData)
            .map(([name, data]) => ({
                name,
                fullName: data.fullName,
                cantidad: data.cantidad,
                monto: data.monto
            }))
            .sort((a, b) => b.monto - a.monto)
            .slice(0, 5);
    }, [ecfEmitidos]);

    // Calcular ITBIS (18% del monto gravado aproximadamente)
    const ventasDesglose = useMemo(() => {
        const totalVentas = stats.montoEmitidos;
        // Estimación: el ITBIS es aproximadamente el 15.25% del total (18/118)
        const itbisEstimado = totalVentas * 0.1525;
        const subtotal = totalVentas - itbisEstimado;
        
        return {
            subtotal,
            itbis: itbisEstimado,
            total: totalVentas
        };
    }, [stats.montoEmitidos]);

    // Get status badge
    const getStatusBadge = (estado) => {
        const configs = {
            'Aceptado': { label: 'Aceptado', icon: CheckCircle2, className: 'bg-success/10 text-success border-success/20' },
            'Recibido': { label: 'Recibido', icon: CheckCircle2, className: 'bg-success/10 text-success border-success/20' },
            'EnProceso': { label: 'En Proceso', icon: Clock, className: 'bg-info/10 text-info border-info/20' },
            'Rechazado': { label: 'Rechazado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
            null: { label: 'En Cola', icon: Clock, className: 'bg-muted text-muted-foreground border-muted' }
        };
        const config = configs[estado] || configs[null];
        const Icon = config.icon;
        
        return (
            <Badge variant="outline" className={cn("text-xs", config.className)}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    // Get certificate status
    const getCertificateStatus = () => {
        if (certificados.length === 0) return { status: 'none', message: 'Sin certificado', variant: 'destructive' };
        const activo = certificados.find(c => c.estado === 'Activo' || c.esActivo);
        if (activo) {
            const vencimiento = activo.fechaVencimiento ? new Date(activo.fechaVencimiento) : null;
            const hoy = new Date();
            const diasRestantes = vencimiento ? Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24)) : null;
            
            if (diasRestantes && diasRestantes <= 30) {
                return { status: 'warning', message: `Vence en ${diasRestantes} días`, variant: 'warning' };
            }
            return { status: 'active', message: 'Certificado activo', variant: 'success' };
        }
        return { status: 'expired', message: 'Certificado vencido', variant: 'destructive' };
    };

    const certStatus = getCertificateStatus();

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                    <p className="font-medium text-foreground">{label || payload[0].name}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                            {entry.dataKey === 'monto' ? formatCurrency(entry.value) : `${entry.value} comprobante(s)`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                        ¡Bienvenido, {user?.name?.split(' ')[0] || 'Usuario'}!
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {currentDate.charAt(0).toUpperCase() + currentDate.slice(1)}
                        </span>
                        {user?.sucursal && (
                            <>
                                <span className="text-muted-foreground/50">•</span>
                                <span className="flex items-center gap-1">
                                    <Building2 className="h-4 w-4" />
                                    {user.sucursal.nombre}
                                </span>
                            </>
                        )}
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchDashboardData}
                    disabled={isLoading}
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Actualizar
                </Button>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* HERO CHART - Resumen de Ventas */}
            <Card className="col-span-full bg-gradient-to-br from-primary/5 via-background to-success/5 border-primary/20">
                <CardHeader className="pb-2">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <TrendingUp className="h-6 w-6 text-primary" />
                                </div>
                                Resumen de Ventas
                            </CardTitle>
                            <CardDescription className="mt-1">Facturación electrónica emitida</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total Ventas</p>
                                <p className="text-3xl font-bold text-primary">
                                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : formatCurrency(stats.montoEmitidos)}
                                </p>
                            </div>
                            <div className="text-right border-l pl-4">
                                <p className="text-xs text-muted-foreground">Comprobantes</p>
                                <p className="text-3xl font-bold text-foreground">{stats.totalEmitidos}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Gráfico Principal de Ventas por Tipo */}
                            <div className="lg:col-span-2">
                                <p className="text-sm font-medium text-muted-foreground mb-4">Ventas por Tipo de Comprobante</p>
                                {ventasPorTipoData.length === 0 ? (
                                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                        No hay datos de ventas disponibles
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <ComposedChart data={ventasPorTipoData}>
                                            <defs>
                                                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                                            <XAxis 
                                                dataKey="shortName" 
                                                tick={{ fontSize: 12 }}
                                                className="text-xs"
                                            />
                                            <YAxis 
                                                yAxisId="left"
                                                tickFormatter={formatShortCurrency}
                                                tick={{ fontSize: 11 }}
                                                className="text-xs"
                                            />
                                            <YAxis 
                                                yAxisId="right"
                                                orientation="right"
                                                tick={{ fontSize: 11 }}
                                                className="text-xs"
                                            />
                                            <Tooltip 
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-popover border rounded-lg shadow-lg p-3">
                                                                <p className="font-medium text-foreground">{data.name}</p>
                                                                <p className="text-sm text-primary">Monto: {formatCurrency(data.monto)}</p>
                                                                <p className="text-sm text-muted-foreground">Cantidad: {data.cantidad}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar 
                                                yAxisId="left"
                                                dataKey="monto" 
                                                fill="url(#colorVentas)"
                                                radius={[4, 4, 0, 0]}
                                                name="Monto"
                                            />
                                            <Line 
                                                yAxisId="right"
                                                type="monotone" 
                                                dataKey="cantidad" 
                                                stroke="#22c55e" 
                                                strokeWidth={2}
                                                dot={{ fill: '#22c55e', strokeWidth: 2 }}
                                                name="Cantidad"
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Panel de Desglose */}
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-muted-foreground">Desglose de Facturación</p>
                                
                                {/* Subtotal */}
                                <div className="p-4 rounded-lg bg-secondary/50 border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Subtotal (sin ITBIS)</span>
                                        <span className="font-semibold">{formatCurrency(ventasDesglose.subtotal)}</span>
                                    </div>
                                </div>
                                
                                {/* ITBIS */}
                                <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-warning">ITBIS (18%)</span>
                                        <span className="font-semibold text-warning">{formatCurrency(ventasDesglose.itbis)}</span>
                                    </div>
                                </div>
                                
                                {/* Total */}
                                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-primary">Total Facturado</span>
                                        <span className="text-xl font-bold text-primary">{formatCurrency(ventasDesglose.total)}</span>
                                    </div>
                                </div>

                                {/* Top Clientes */}
                                {ventasPorClienteData.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Top Clientes</p>
                                        <div className="space-y-2">
                                            {ventasPorClienteData.slice(0, 3).map((cliente, index) => (
                                                <div 
                                                    key={index}
                                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                                                >
                                                    <span className="text-xs truncate flex-1 mr-2" title={cliente.fullName}>
                                                        {cliente.name}
                                                    </span>
                                                    <span className="text-xs font-medium text-primary whitespace-nowrap">
                                                        {formatCurrency(cliente.monto)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CTA */}
                                <Button 
                                    variant="outline" 
                                    className="w-full mt-2"
                                    onClick={() => navigate('/dashboard/reportes')}
                                >
                                    Ver detalle de ventas
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* eCF Emitidos */}
                <Card 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate('/dashboard/reportes')}
                    data-testid="stat-ecf-emitidos"
                >
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">e-CF Emitidos</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalEmitidos}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {formatCurrency(stats.montoEmitidos)}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Send className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* eCF Recibidos */}
                <Card 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate('/dashboard/reportes-recibidos')}
                    data-testid="stat-ecf-recibidos"
                >
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">e-CF Recibidos</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalRecibidos}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {formatCurrency(stats.montoRecibidos)}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-success/10">
                                <Inbox className="h-6 w-6 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Comprobantes NCF */}
                <Card 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate('/dashboard/comprobantes')}
                    data-testid="stat-comprobantes"
                >
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tipos NCF</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalComprobantes}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {stats.comprobantesHabilitados} habilitados
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-accent/10">
                                <Receipt className="h-6 w-6 text-accent" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Certificados */}
                <Card 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate('/dashboard/certificados')}
                    data-testid="stat-certificados"
                >
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Certificados</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalCertificados}
                                </p>
                                <Badge variant="outline" className={cn(
                                    "mt-1 text-xs",
                                    certStatus.variant === 'success' && "bg-success/10 text-success border-success/20",
                                    certStatus.variant === 'warning' && "bg-warning/10 text-warning border-warning/20",
                                    certStatus.variant === 'destructive' && "bg-destructive/10 text-destructive border-destructive/20"
                                )}>
                                    {certStatus.message}
                                </Badge>
                            </div>
                            <div className={cn(
                                "p-3 rounded-xl",
                                certStatus.variant === 'success' && "bg-success/10",
                                certStatus.variant === 'warning' && "bg-warning/10",
                                certStatus.variant === 'destructive' && "bg-destructive/10"
                            )}>
                                <Shield className={cn(
                                    "h-6 w-6",
                                    certStatus.variant === 'success' && "text-success",
                                    certStatus.variant === 'warning' && "text-warning",
                                    certStatus.variant === 'destructive' && "text-destructive"
                                )} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart - Emitidos vs Recibidos (Montos) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Comparación de Montos
                        </CardTitle>
                        <CardDescription>e-CF Emitidos vs Recibidos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-[250px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={emitidosVsRecibidosData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis 
                                        type="number" 
                                        tickFormatter={formatShortCurrency}
                                        className="text-xs"
                                    />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        width={80}
                                        className="text-xs"
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar 
                                        dataKey="monto" 
                                        radius={[0, 4, 4, 0]}
                                    >
                                        {emitidosVsRecibidosData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {/* Summary below chart */}
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{formatCurrency(stats.montoEmitidos)}</p>
                                <p className="text-xs text-muted-foreground">Total Emitido</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-success">{formatCurrency(stats.montoRecibidos)}</p>
                                <p className="text-xs text-muted-foreground">Total Recibido</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart - Tipos de eCF */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-accent" />
                            Distribución por Tipo
                        </CardTitle>
                        <CardDescription>Comprobantes por tipo de e-CF</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-[250px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : ecfByTipoData.length === 0 ? (
                            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                No hay datos disponibles
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={ecfByTipoData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, value }) => `${value}`}
                                        labelLine={false}
                                    >
                                        {ecfByTipoData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={PIE_COLORS[index % PIE_COLORS.length]} 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value) => <span className="text-xs">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-primary/5 to-success/5 border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Balance Neto (Emitido - Recibido)</p>
                            <p className={cn(
                                "text-3xl font-bold mt-1",
                                stats.montoEmitidos - stats.montoRecibidos >= 0 ? "text-success" : "text-destructive"
                            )}>
                                {formatCurrency(stats.montoEmitidos - stats.montoRecibidos)}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
                                <p className="text-lg font-bold text-primary">{stats.totalEmitidos}</p>
                                <p className="text-xs text-muted-foreground">Emitidos</p>
                            </div>
                            <div className="text-center px-4 py-2 rounded-lg bg-success/10">
                                <p className="text-lg font-bold text-success">{stats.totalRecibidos}</p>
                                <p className="text-xs text-muted-foreground">Recibidos</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent eCF Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Últimos eCF Emitidos */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Últimos e-CF Emitidos</CardTitle>
                            <CardDescription>Comprobantes enviados recientemente</CardDescription>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate('/dashboard/reportes')}
                        >
                            Ver todos
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : ecfEmitidos.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No hay e-CF emitidos
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>e-NCF</TableHead>
                                            <TableHead>Receptor</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ecfEmitidos.slice(0, 5).map((ecf) => (
                                            <TableRow key={ecf.id}>
                                                <TableCell className="font-mono text-sm">{ecf.e_NCF}</TableCell>
                                                <TableCell className="text-sm truncate max-w-[150px]">
                                                    {ecf.razonSocialComprador || ecf.rncComprador}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(ecf.monto)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(ecf.estado)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Últimos eCF Recibidos */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Últimos e-CF Recibidos</CardTitle>
                            <CardDescription>Comprobantes recibidos recientemente</CardDescription>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate('/dashboard/reportes-recibidos')}
                        >
                            Ver todos
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : ecfRecibidos.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No hay e-CF recibidos
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>e-NCF</TableHead>
                                            <TableHead>RNC Emisor</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ecfRecibidos.slice(0, 5).map((ecf, index) => (
                                            <TableRow key={`${ecf.encf}-${index}`}>
                                                <TableCell className="font-mono text-sm">{ecf.encf}</TableCell>
                                                <TableCell className="font-mono text-sm">{ecf.rncEmisor}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(ecf.montoTotal)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(ecf.estado)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Comprobantes NCF Status - SORTED BY TYPE */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Estado de Comprobantes NCF</CardTitle>
                        <CardDescription>Secuencias de comprobantes fiscales asignados por la DGII (ordenados por tipo)</CardDescription>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate('/dashboard/comprobantes')}
                    >
                        Ver detalles
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : sortedComprobantes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No hay comprobantes asignados
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
                            {sortedComprobantes.map((comp) => (
                                <div 
                                    key={comp.id}
                                    className={cn(
                                        "p-3 rounded-lg border text-center transition-all hover:scale-105",
                                        comp.habilitado 
                                            ? "bg-success/5 border-success/20 hover:bg-success/10" 
                                            : "bg-muted/50 border-muted hover:bg-muted"
                                    )}
                                >
                                    <p className={cn(
                                        "text-2xl font-bold",
                                        comp.habilitado ? "text-success" : "text-muted-foreground"
                                    )}>
                                        {comp.tipoeCF}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate" title={tipoEcfMap[comp.tipoeCF] || comp.descripcion}>
                                        {tipoEcfMap[comp.tipoeCF] || comp.descripcion}
                                    </p>
                                    <div className={cn(
                                        "mt-2 w-2 h-2 rounded-full mx-auto",
                                        comp.habilitado ? "bg-success" : "bg-muted-foreground"
                                    )} />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Company Info Footer */}
            <Card className="bg-primary/5 border-primary/10">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Empresa</p>
                            <p className="text-lg font-bold text-foreground">{company?.name || 'Mi Empresa'}</p>
                            <p className="text-sm text-muted-foreground">RNC: {company?.rnc || 'N/A'}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/empresa')}>
                                Ver información
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/configuracion')}>
                                Configuración
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
