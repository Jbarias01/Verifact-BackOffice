import React, { useState, useEffect, useCallback } from 'react';
import { 
    Inbox, 
    Search,
    RefreshCw,
    Loader2,
    Calendar,
    Hash,
    DollarSign,
    Eye,
    Download,
    Building2,
    CheckCircle2,
    Clock,
    XCircle,
    FileCode,
    Filter,
    X,
    FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import axios from 'axios';

// API URL Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const VERIFACT_API_DIRECT = process.env.REACT_APP_VERIFACT_API_URL || '';
const USE_PROXY = BACKEND_URL && BACKEND_URL.includes('preview.emergentagent.com');
const API_BASE_URL = USE_PROXY ? `${BACKEND_URL}/api` : VERIFACT_API_DIRECT;

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP'
    }).format(amount || 0);
};

// Helper to format date for display
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Handle DD-MM-YYYY format
    if (dateString.includes('-') && dateString.length === 10 && !dateString.includes('T')) {
        const parts = dateString.split('-');
        if (parts[0].length === 2) {
            return `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('es-DO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Helper to format datetime
const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    // Handle "28-02-2026 20:45:25" format
    if (dateString.includes('-') && dateString.includes(' ') && dateString.includes(':')) {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('-');
        return `${day}/${month}/${year} ${timePart}`;
    }
    const date = new Date(dateString);
    return date.toLocaleString('es-DO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Tipo eCF mapping
const tipoEcfMap = {
    '31': 'Factura de Crédito Fiscal',
    '32': 'Factura de Consumo',
    '33': 'Nota de Débito',
    '34': 'Nota de Crédito',
    '41': 'Compras',
    '43': 'Gastos Menores',
    '44': 'Regímenes Especiales',
    '45': 'Gubernamental',
    '46': 'Exportación',
    '47': 'Pagos al Exterior'
};

// Status configuration
const statusConfig = {
    'Recibido': { 
        label: 'Recibido', 
        icon: CheckCircle2,
        className: 'bg-success/10 text-success border-success/20'
    },
    'Procesado': { 
        label: 'Procesado', 
        icon: CheckCircle2,
        className: 'bg-primary/10 text-primary border-primary/20'
    },
    'Pendiente': { 
        label: 'Pendiente', 
        icon: Clock,
        className: 'bg-warning/10 text-warning border-warning/20'
    },
    'Rechazado': { 
        label: 'Rechazado', 
        icon: XCircle,
        className: 'bg-destructive/10 text-destructive border-destructive/20'
    }
};

const EcfRecibidosReport = () => {
    const { token } = useAuth();
    
    // State
    const [ecfRecibidos, setEcfRecibidos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter states
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [rncEmisorFilter, setRncEmisorFilter] = useState('');
    const [rncReceptorFilter, setRncReceptorFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // API response metadata
    const [responseMetadata, setResponseMetadata] = useState({
        total: 0,
        rncReceptor: null,
        filtroRncEmisor: null,
        filtroRncReceptor: null,
        filtroDesde: null,
        filtroHasta: null,
        filtroEstado: null
    });
    
    // Modal states
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedEcf, setSelectedEcf] = useState(null);

    // Fetch eCF recibidos with filters
    const fetchEcfRecibidos = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const url = USE_PROXY 
                ? `${API_BASE_URL}/fe/recepcion/ecf/recibidos/filtros`
                : `${API_BASE_URL}/fe/recepcion/api/ecf/recibidos`;
            
            // Build params
            const params = {};
            if (fechaDesde) params.desde = new Date(fechaDesde).toISOString();
            if (fechaHasta) params.hasta = new Date(fechaHasta).toISOString();
            if (estadoFilter) params.estado = estadoFilter;
            if (rncEmisorFilter) params.rncEmisor = rncEmisorFilter;
            if (rncReceptorFilter) params.rncReceptor = rncReceptorFilter;
            
            const response = await axios.get(url, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = response.data;
            
            if (data.ecfRecibidos && Array.isArray(data.ecfRecibidos)) {
                setEcfRecibidos(data.ecfRecibidos);
                setResponseMetadata({
                    total: data.total || data.ecfRecibidos.length,
                    rncReceptor: data.rncReceptor,
                    filtroRncEmisor: data.filtroRncEmisor,
                    filtroRncReceptor: data.filtroRncReceptor,
                    filtroDesde: data.filtroDesde,
                    filtroHasta: data.filtroHasta,
                    filtroEstado: data.filtroEstado
                });
            } else if (data.success === false) {
                setError(data.message || 'Error al obtener eCF recibidos');
            }
        } catch (err) {
            console.error('Error fetching received eCF:', err);
            if (err.response?.status === 401) {
                setError('No autorizado. Verifique sus permisos o inicie sesión nuevamente.');
            } else {
                setError('Error al cargar los eCF recibidos');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, fechaDesde, fechaHasta, estadoFilter, rncEmisorFilter, rncReceptorFilter]);

    useEffect(() => {
        fetchEcfRecibidos();
    }, []);

    // Filter eCF locally by search term
    const filteredEcf = ecfRecibidos.filter(ecf => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            ecf.encf?.toLowerCase().includes(term) ||
            ecf.rncEmisor?.toLowerCase().includes(term) ||
            ecf.archivoXml?.toLowerCase().includes(term)
        );
    });

    // Get status badge
    const getStatusBadge = (estado) => {
        const config = statusConfig[estado] || { 
            label: estado || 'Desconocido', 
            icon: Clock,
            className: 'bg-muted text-muted-foreground border-muted' 
        };
        const Icon = config.icon;
        
        return (
            <Badge variant="outline" className={cn("font-medium", config.className)}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    // Open detail modal
    const openDetail = (ecf) => {
        setSelectedEcf(ecf);
        setIsDetailOpen(true);
    };

    // Clear filters
    const clearFilters = () => {
        setFechaDesde('');
        setFechaHasta('');
        setEstadoFilter('');
        setRncEmisorFilter('');
        setRncReceptorFilter('');
        setSearchTerm('');
    };

    // Apply filters
    const applyFilters = () => {
        fetchEcfRecibidos();
    };

    // Calculate stats
    const stats = {
        total: responseMetadata.total,
        montoTotal: ecfRecibidos.reduce((sum, e) => sum + (e.montoTotal || 0), 0),
        recibidos: ecfRecibidos.filter(e => e.estado === 'Recibido').length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Inbox className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            e-CF Recibidos
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Reporte de comprobantes fiscales electrónicos recibidos
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchEcfRecibidos}
                    disabled={isLoading}
                    data-testid="refresh-ecf-recibidos-btn"
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
                                <p className="text-xs text-muted-foreground">Total Recibidos</p>
                                <p className="text-xl font-bold text-foreground">{stats.total}</p>
                            </div>
                            <Inbox className="h-5 w-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Estado Recibido</p>
                                <p className="text-xl font-bold text-success">{stats.recibidos}</p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Monto Total</p>
                            <p className="text-lg font-bold text-foreground">{formatCurrency(stats.montoTotal)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fechaDesde">Desde</Label>
                            <Input
                                id="fechaDesde"
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                data-testid="filter-fecha-desde"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fechaHasta">Hasta</Label>
                            <Input
                                id="fechaHasta"
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                data-testid="filter-fecha-hasta"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Select value={estadoFilter} onValueChange={(val) => setEstadoFilter(val === 'all' ? '' : val)}>
                                <SelectTrigger id="estado" data-testid="filter-estado">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="Recibido">Recibido</SelectItem>
                                    <SelectItem value="Procesado">Procesado</SelectItem>
                                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rncEmisor">RNC Emisor</Label>
                            <Input
                                id="rncEmisor"
                                placeholder="Ej: 131880681"
                                value={rncEmisorFilter}
                                onChange={(e) => setRncEmisorFilter(e.target.value)}
                                data-testid="filter-rnc-emisor"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rncReceptor">RNC Receptor</Label>
                            <Input
                                id="rncReceptor"
                                placeholder="Ej: 132062884"
                                value={rncReceptorFilter}
                                onChange={(e) => setRncReceptorFilter(e.target.value)}
                                data-testid="filter-rnc-receptor"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={applyFilters} className="flex-1" data-testid="apply-filters-btn">
                                <Search className="h-4 w-4 mr-2" />
                                Buscar
                            </Button>
                            <Button variant="outline" onClick={clearFilters} data-testid="clear-filters-btn">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Local search */}
                    <div className="mt-4 pt-4 border-t">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar en resultados: eNCF, RNC emisor, archivo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                data-testid="search-input"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active filters info */}
            {(responseMetadata.filtroRncEmisor || responseMetadata.filtroRncReceptor) && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium text-primary">Filtros aplicados:</span>
                            {responseMetadata.filtroRncEmisor && (
                                <Badge variant="outline">RNC Emisor: {responseMetadata.filtroRncEmisor}</Badge>
                            )}
                            {responseMetadata.filtroRncReceptor && (
                                <Badge variant="outline">RNC Receptor: {responseMetadata.filtroRncReceptor}</Badge>
                            )}
                            {responseMetadata.rncReceptor && (
                                <span className="text-muted-foreground">Tu RNC: {responseMetadata.rncReceptor}</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error message */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive text-center">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* eCF Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Comprobantes Recibidos</CardTitle>
                    <CardDescription>
                        {filteredEcf.length} de {ecfRecibidos.length} comprobante(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredEcf.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No se encontraron eCF recibidos
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>e-NCF</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>RNC Emisor</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead>Emisión</TableHead>
                                        <TableHead>Recepción</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="w-[80px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEcf.map((ecf, index) => (
                                        <TableRow key={`${ecf.encf}-${index}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-mono font-medium">{ecf.encf}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm" title={tipoEcfMap[ecf.tipoECF] || ecf.tipoECF}>
                                                    {ecf.tipoECF} - {tipoEcfMap[ecf.tipoECF] || 'Otro'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="font-mono">{ecf.rncEmisor}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(ecf.montoTotal)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDate(ecf.fechaEmision)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDateTime(ecf.fechaRecepcion)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(ecf.estado)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openDetail(ecf)}
                                                    className="h-8 w-8"
                                                    title="Ver detalle"
                                                    data-testid={`view-detail-${ecf.encf}`}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Detalle de e-CF Recibido
                        </DialogTitle>
                        <DialogDescription>
                            Información completa del comprobante electrónico
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedEcf && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                <div>
                                    <p className="text-sm text-muted-foreground">e-NCF</p>
                                    <p className="text-lg font-mono font-bold">{selectedEcf.encf}</p>
                                </div>
                                {getStatusBadge(selectedEcf.estado)}
                            </div>
                            
                            {/* Emisor Info */}
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <p className="text-xs text-muted-foreground">RNC Emisor</p>
                                <p className="text-sm font-mono font-bold">{selectedEcf.rncEmisor}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Tipo e-CF</p>
                                    <p className="text-sm">{tipoEcfMap[selectedEcf.tipoECF] || selectedEcf.tipoECF}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Monto Total</p>
                                    <p className="text-sm font-bold text-primary">{formatCurrency(selectedEcf.montoTotal)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Fecha Emisión</p>
                                    <p className="text-sm">{formatDate(selectedEcf.fechaEmision)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Fecha Recepción</p>
                                    <p className="text-sm">{formatDateTime(selectedEcf.fechaRecepcion)}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Archivo XML</p>
                                <p className="text-sm font-mono break-all">{selectedEcf.archivoXml}</p>
                            </div>
                            
                            {selectedEcf.rutaArchivo && (
                                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground">Ruta del Archivo</p>
                                    <p className="text-xs font-mono break-all text-muted-foreground">{selectedEcf.rutaArchivo}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EcfRecibidosReport;
