import React, { useState, useEffect, useCallback } from 'react';
import { 
    Receipt, 
    RefreshCw,
    Loader2,
    Hash,
    CheckCircle2,
    XCircle,
    Calendar,
    AlertTriangle,
    FileText,
    ArrowRight
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

// API URL Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const VERIFACT_API_DIRECT = process.env.REACT_APP_VERIFACT_API_URL || 'https://ecf-test.api.verifact.com.do';
const USE_PROXY = BACKEND_URL && BACKEND_URL.includes('preview.emergentagent.com');
const API_BASE_URL = USE_PROXY ? `${BACKEND_URL}/api` : VERIFACT_API_DIRECT;

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-DO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Tipo eCF icon mapping
const tipoEcfIcons = {
    '31': { color: 'text-blue-500', bg: 'bg-blue-500/10' },
    '32': { color: 'text-green-500', bg: 'bg-green-500/10' },
    '33': { color: 'text-orange-500', bg: 'bg-orange-500/10' },
    '34': { color: 'text-red-500', bg: 'bg-red-500/10' },
    '41': { color: 'text-purple-500', bg: 'bg-purple-500/10' },
    '43': { color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    '44': { color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    '45': { color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    '46': { color: 'text-pink-500', bg: 'bg-pink-500/10' },
    '47': { color: 'text-teal-500', bg: 'bg-teal-500/10' },
};

const Comprobantes = () => {
    const { token } = useAuth();
    
    // State
    const [comprobantes, setComprobantes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch comprobantes
    const fetchComprobantes = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const url = USE_PROXY 
                ? `${API_BASE_URL}/comprobantes/cliente`
                : `${API_BASE_URL}/api/comprobantes/cliente`;
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (Array.isArray(response.data)) {
                // Sort by tipoeCF
                const sorted = response.data.sort((a, b) => parseInt(a.tipoeCF) - parseInt(b.tipoeCF));
                setComprobantes(sorted);
            } else if (response.data.success === false) {
                setError(response.data.message || 'Error al obtener comprobantes');
            }
        } catch (err) {
            console.error('Error fetching comprobantes:', err);
            if (err.response?.status === 401) {
                setError('No autorizado. Verifique sus permisos o inicie sesión nuevamente.');
            } else {
                setError('Error al cargar los comprobantes');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchComprobantes();
    }, [fetchComprobantes]);

    // Calculate stats
    const stats = {
        total: comprobantes.length,
        habilitados: comprobantes.filter(c => c.habilitado).length,
        deshabilitados: comprobantes.filter(c => !c.habilitado).length
    };

    // Get status badge
    const getStatusBadge = (habilitado) => {
        if (habilitado) {
            return (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Habilitado
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
                <XCircle className="h-3 w-3 mr-1" />
                Deshabilitado
            </Badge>
        );
    };

    // Get sequence info
    const getSequenceInfo = (comp) => {
        if (comp.secuenciaInicial === 0 && comp.secuenciaFinal === 0) {
            return (
                <span className="text-muted-foreground text-sm">Sin asignar</span>
            );
        }
        return (
            <div className="flex items-center gap-1 text-sm font-mono">
                <span>{comp.secuenciaInicial}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span>{comp.secuenciaFinal}</span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Receipt className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Comprobantes Fiscales
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Secuencias de comprobantes electrónicos asignados
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchComprobantes}
                    disabled={isLoading}
                    data-testid="refresh-comprobantes-btn"
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Actualizar
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Tipos</p>
                                <p className="text-xl font-bold text-foreground">{stats.total}</p>
                            </div>
                            <Receipt className="h-5 w-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Habilitados</p>
                                <p className="text-xl font-bold text-success">{stats.habilitados}</p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Deshabilitados</p>
                                <p className="text-xl font-bold text-muted-foreground">{stats.deshabilitados}</p>
                            </div>
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Error message */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive text-center">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Comprobantes Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Tipos de Comprobantes</CardTitle>
                    <CardDescription>
                        Secuencias de comprobantes fiscales electrónicos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : comprobantes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No se encontraron comprobantes asignados
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Secuencia</TableHead>
                                        <TableHead className="text-center">Actual</TableHead>
                                        <TableHead>Vigencia</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {comprobantes.map((comp) => {
                                        const iconStyle = tipoEcfIcons[comp.tipoeCF] || { color: 'text-gray-500', bg: 'bg-gray-500/10' };
                                        return (
                                            <TableRow key={comp.id}>
                                                <TableCell>
                                                    <div className={cn("inline-flex items-center gap-2 px-2 py-1 rounded", iconStyle.bg)}>
                                                        <Hash className={cn("h-4 w-4", iconStyle.color)} />
                                                        <span className={cn("font-mono font-bold", iconStyle.color)}>
                                                            {comp.tipoeCF}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{comp.descripcion}</span>
                                                </TableCell>
                                                <TableCell>
                                                    {getSequenceInfo(comp)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-mono font-bold text-primary">
                                                        {comp.secuenciaActual || 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-xs">
                                                        <span className="text-muted-foreground">
                                                            Desde: {formatDate(comp.vigenciaDesde)}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            Hasta: {formatDate(comp.vigenciaHasta)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(comp.habilitado)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-info/20 bg-info/5">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-foreground">Información sobre Comprobantes</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Los comprobantes fiscales electrónicos (eCF) son asignados por la DGII. 
                                Para solicitar nuevas secuencias o habilitar tipos adicionales, 
                                contacte a su proveedor de facturación electrónica.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Comprobantes;
