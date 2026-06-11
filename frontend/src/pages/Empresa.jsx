import React, { useState, useEffect, useCallback } from 'react';
import { 
    Building2, 
    RefreshCw,
    Loader2,
    Mail,
    Hash,
    Calendar,
    CheckCircle2,
    XCircle,
    CreditCard,
    Clock,
    Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import axios from 'axios';

import { apiUrl, USE_PROXY } from '@/lib/api';

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

// Plan badges configuration
const planConfig = {
    'Básico': { className: 'bg-muted text-muted-foreground', icon: CreditCard },
    'Profesional': { className: 'bg-primary/10 text-primary border-primary/20', icon: Shield },
    'Empresarial': { className: 'bg-success/10 text-success border-success/20', icon: Building2 },
};

const Empresa = () => {
    const { token } = useAuth();
    
    // State
    const [empresa, setEmpresa] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch company data
    const fetchEmpresa = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const url = apiUrl(`clientes`);
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // API returns an array, get the first element
            if (Array.isArray(response.data) && response.data.length > 0) {
                setEmpresa(response.data[0]);
            } else if (response.data.success === false) {
                setError(response.data.message || 'Error al obtener datos de la empresa');
            } else {
                setError('No se encontraron datos de la empresa');
            }
        } catch (err) {
            console.error('Error fetching company:', err);
            if (err.response?.status === 401) {
                setError('No autorizado. Verifique sus permisos o inicie sesión nuevamente.');
            } else {
                setError('Error al cargar los datos de la empresa');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchEmpresa();
    }, [fetchEmpresa]);

    // Get plan badge
    const getPlanBadge = (plan) => {
        const config = planConfig[plan] || planConfig['Básico'];
        const Icon = config.icon;
        
        return (
            <Badge variant="outline" className={cn("font-medium text-sm px-3 py-1", config.className)}>
                <Icon className="h-4 w-4 mr-2" />
                {plan || 'Sin Plan'}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Datos de la Empresa
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Información de su empresa registrada en Verifact
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchEmpresa}
                    disabled={isLoading}
                    data-testid="refresh-empresa-btn"
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Actualizar
                </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </CardContent>
                </Card>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive text-center">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Company Data */}
            {empresa && !isLoading && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Main Info Card */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl">{empresa.nombre}</CardTitle>
                                    <CardDescription>Información principal de la empresa</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getPlanBadge(empresa.plan)}
                                    {empresa.esActivo !== false ? (
                                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Activo
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Suspendido
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        RNC
                                    </p>
                                    <p className="text-lg font-mono font-bold">{empresa.rnc}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        Correo Electrónico
                                    </p>
                                    <p className="text-lg font-medium">{empresa.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Fecha de Registro
                                    </p>
                                    <p className="text-lg font-medium">{formatDate(empresa.fechaCreacion)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Fecha de Suspensión
                                    </p>
                                    <p className="text-lg font-medium">
                                        {empresa.fechaSuspension ? formatDate(empresa.fechaSuspension) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Plan Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Plan Actual
                            </CardTitle>
                            <CardDescription>Detalles de su suscripción</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center p-6 rounded-lg bg-secondary/50">
                                <div className="text-center">
                                    <div className="mb-4">
                                        {getPlanBadge(empresa.plan)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {empresa.plan === 'Profesional' && 'Acceso a todas las funciones de facturación electrónica'}
                                        {empresa.plan === 'Básico' && 'Funciones básicas de facturación'}
                                        {empresa.plan === 'Empresarial' && 'Funciones avanzadas para grandes empresas'}
                                        {!empresa.plan && 'Sin plan asignado'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Estado de la Cuenta
                            </CardTitle>
                            <CardDescription>Información del estado actual</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                    <span className="text-sm font-medium">Estado</span>
                                    {empresa.esActivo !== false ? (
                                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Cuenta Activa
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Cuenta Suspendida
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                    <span className="text-sm font-medium">Facturación Electrónica</span>
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Habilitada
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ID Card */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Identificadores del Sistema</CardTitle>
                            <CardDescription>IDs únicos de su empresa en el sistema</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground mb-1">ID de Cliente</p>
                                <p className="text-sm font-mono break-all">{empresa.id}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Empresa;
