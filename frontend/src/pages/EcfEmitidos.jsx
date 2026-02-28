import React, { useState, useEffect, useCallback } from 'react';
import { 
    FileText, 
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
    Send
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
import { format, subDays } from 'date-fns';

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
    const date = new Date(dateString);
    return date.toLocaleString('es-DO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper to format date for API (ISO format)
const formatDateForApi = (date) => {
    if (!date) return null;
    return date.toISOString();
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
    'Aceptado': { 
        label: 'Aceptado', 
        icon: CheckCircle2,
        className: 'bg-success/10 text-success border-success/20'
    },
    'AceptadoCondicional': { 
        label: 'Aceptado Condicional', 
        icon: CheckCircle2,
        className: 'bg-warning/10 text-warning border-warning/20'
    },
    'Rechazado': { 
        label: 'Rechazado', 
        icon: XCircle,
        className: 'bg-destructive/10 text-destructive border-destructive/20'
    },
    'EnProceso': { 
        label: 'En Proceso', 
        icon: Clock,
        className: 'bg-info/10 text-info border-info/20'
    },
    'EnCola': { 
        label: 'En Cola', 
        icon: Clock,
        className: 'bg-muted text-muted-foreground border-muted'
    },
    null: { 
        label: 'En Cola', 
        icon: Clock,
        className: 'bg-muted text-muted-foreground border-muted'
    }
};

const EcfEmitidos = () => {
    const { token } = useAuth();
    
    // State
    const [ecfEmitidos, setEcfEmitidos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter states
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [rncReceptorFilter, setRncReceptorFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // API response metadata
    const [responseMetadata, setResponseMetadata] = useState({
        total: 0,
        filtroDesde: null,
        filtroHasta: null,
        filtroEstado: null,
        filtroRncReceptor: null
    });
    
    // Modal states
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isXmlPreviewOpen, setIsXmlPreviewOpen] = useState(false);
    const [selectedEcf, setSelectedEcf] = useState(null);

    // Fetch eCF emitidos
    const fetchEcfEmitidos = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const url = USE_PROXY 
                ? `${API_BASE_URL}/ecf/emitidos`
                : `${API_BASE_URL}/api/ecf/emitidos`;
            
            // Build params
            const params = {};
            if (fechaDesde) params.desde = new Date(fechaDesde).toISOString();
            if (fechaHasta) params.hasta = new Date(fechaHasta).toISOString();
            if (estadoFilter) params.estado = estadoFilter;
            if (rncReceptorFilter) params.rncReceptor = rncReceptorFilter;
            
            const response = await axios.get(url, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = response.data;
            
            if (data.facturas && Array.isArray(data.facturas)) {
                setEcfEmitidos(data.facturas);
                setResponseMetadata({
                    total: data.total || data.facturas.length,
                    filtroDesde: data.filtroDesde,
                    filtroHasta: data.filtroHasta,
                    filtroEstado: data.filtroEstado,
                    filtroRncReceptor: data.filtroRncReceptor
                });
            } else if (data.success === false) {
                setError(data.message || 'Error al obtener eCF emitidos');
            }
        } catch (err) {
            console.error('Error fetching issued eCF:', err);
            if (err.response?.status === 401) {
                setError('No autorizado. Verifique sus permisos o inicie sesión nuevamente.');
            } else {
                setError('Error al cargar los eCF emitidos');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, fechaDesde, fechaHasta, estadoFilter, rncReceptorFilter]);

    useEffect(() => {
        fetchEcfEmitidos();
    }, []);

    // Filter eCF locally by search term
    const filteredEcf = ecfEmitidos.filter(ecf => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            ecf.e_NCF?.toLowerCase().includes(term) ||
            ecf.rncComprador?.toLowerCase().includes(term) ||
            ecf.razonSocialComprador?.toLowerCase().includes(term) ||
            ecf.fileName?.toLowerCase().includes(term)
        );
    });

    // Get status badge
    const getStatusBadge = (estado) => {
        const config = statusConfig[estado] || statusConfig[null];
        const Icon = config.icon;
        
        return (
            <Badge variant="outline" className={cn("font-medium", config.className)}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    // Extract tipo eCF from e_NCF
    const getTipoEcf = (encf) => {
        if (!encf) return 'N/A';
        // e_NCF format: E310000000170 - first 2 chars after E is the tipo
        const match = encf.match(/^E(\d{2})/);
        if (match) {
            return match[1];
        }
        return 'N/A';
    };

    // Open detail modal
    const openDetail = (ecf) => {
        setSelectedEcf(ecf);
        setIsDetailOpen(true);
    };

    // Preview XML
    const previewXml = (ecf) => {
        setSelectedEcf(ecf);
        setIsXmlPreviewOpen(true);
    };

    // Download XML
    const downloadXml = (ecf) => {
        if (!ecf.xmlContent) {
            toast.error('No hay contenido XML disponible');
            return;
        }
        
        const blob = new Blob([ecf.xmlContent], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ecf.fileName || `${ecf.e_NCF}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Archivo XML descargado');
    };

    // Clear filters
    const clearFilters = () => {
        setFechaDesde('');
        setFechaHasta('');
        setEstadoFilter('');
        setRncReceptorFilter('');
        setSearchTerm('');
    };

    // Apply filters
    const applyFilters = () => {
        fetchEcfEmitidos();
    };

    // Calculate stats
    const stats = {
        total: responseMetadata.total,
        montoTotal: ecfEmitidos.reduce((sum, e) => sum + (e.monto || 0), 0),
        aceptados: ecfEmitidos.filter(e => e.estado === 'Aceptado').length,
        enCola: ecfEmitidos.filter(e => !e.estado).length
    };

    // Format XML for display
    const formatXml = (xml) => {
        if (!xml) return '';
        try {
            // Simple formatting - add newlines and indentation
            let formatted = '';
            let indent = 0;
            const parts = xml.split(/(<[^>]+>)/);
            
            parts.forEach(part => {
                if (!part.trim()) return;
                
                if (part.match(/<\/[^>]+>/)) {
                    indent--;
                    formatted += '  '.repeat(Math.max(0, indent)) + part + '\n';
                } else if (part.match(/<[^/][^>]*\/>/)) {
                    formatted += '  '.repeat(indent) + part + '\n';
                } else if (part.match(/<[^/][^>]*>/)) {
                    formatted += '  '.repeat(indent) + part + '\n';
                    if (!part.match(/<\?/)) indent++;
                } else {
                    formatted += '  '.repeat(indent) + part.trim() + '\n';
                }
            });
            
            return formatted;
        } catch {
            return xml;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Send className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            e-CF Emitidos
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Comprobantes fiscales electrónicos emitidos
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchEcfEmitidos}
                    disabled={isLoading}
                    data-testid="refresh-ecf-emitidos-btn"
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Actualizar
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Emitidos</p>
                                <p className="text-xl font-bold text-foreground">{stats.total}</p>
                            </div>
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Aceptados</p>
                                <p className="text-xl font-bold text-success">{stats.aceptados}</p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">En Cola</p>
                                <p className="text-xl font-bold text-muted-foreground">{stats.enCola}</p>
                            </div>
                            <Clock className="h-5 w-5 text-muted-foreground" />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                                    <SelectItem value="Aceptado">Aceptado</SelectItem>
                                    <SelectItem value="AceptadoCondicional">Aceptado Condicional</SelectItem>
                                    <SelectItem value="EnProceso">En Proceso</SelectItem>
                                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rncReceptor">RNC Receptor</Label>
                            <Input
                                id="rncReceptor"
                                placeholder="Ej: 131880681"
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
                                placeholder="Buscar en resultados: eNCF, RNC, razón social..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                data-testid="search-input"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                    <CardTitle>Comprobantes Emitidos</CardTitle>
                    <CardDescription>
                        {filteredEcf.length} de {ecfEmitidos.length} comprobante(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredEcf.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No se encontraron eCF emitidos
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>e-NCF</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>RNC Receptor</TableHead>
                                        <TableHead>Receptor</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead>Fecha Firma</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="w-[120px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEcf.map((ecf) => {
                                        const tipoEcf = getTipoEcf(ecf.e_NCF);
                                        return (
                                            <TableRow key={ecf.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Hash className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-mono font-medium">{ecf.e_NCF}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm" title={tipoEcfMap[tipoEcf] || tipoEcf}>
                                                        {tipoEcf} - {tipoEcfMap[tipoEcf] || 'Otro'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {ecf.rncComprador}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-sm font-medium truncate max-w-[200px]" title={ecf.razonSocialComprador}>
                                                            {ecf.razonSocialComprador || 'N/A'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(ecf.monto)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDateTime(ecf.fechaHoraFirma)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(ecf.estado)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openDetail(ecf)}
                                                            className="h-8 w-8"
                                                            title="Ver detalle"
                                                            data-testid={`view-detail-${ecf.id}`}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => previewXml(ecf)}
                                                            className="h-8 w-8"
                                                            title="Ver XML"
                                                            data-testid={`view-xml-${ecf.id}`}
                                                        >
                                                            <FileCode className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => downloadXml(ecf)}
                                                            className="h-8 w-8"
                                                            title="Descargar XML"
                                                            data-testid={`download-xml-${ecf.id}`}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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

            {/* Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Detalle de e-CF Emitido
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
                                    <p className="text-lg font-mono font-bold">{selectedEcf.e_NCF}</p>
                                </div>
                                {getStatusBadge(selectedEcf.estado)}
                            </div>
                            
                            {/* Receptor Info */}
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <p className="text-xs text-muted-foreground">Receptor</p>
                                <p className="text-sm font-bold">{selectedEcf.razonSocialComprador}</p>
                                <p className="text-xs text-muted-foreground mt-1">RNC: {selectedEcf.rncComprador}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">RNC Emisor</p>
                                    <p className="text-sm font-mono">{selectedEcf.rnc}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Tipo e-CF</p>
                                    <p className="text-sm">{tipoEcfMap[getTipoEcf(selectedEcf.e_NCF)] || getTipoEcf(selectedEcf.e_NCF)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Monto Total</p>
                                    <p className="text-sm font-bold text-primary">{formatCurrency(selectedEcf.monto)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Código Seguridad</p>
                                    <p className="text-sm font-mono">{selectedEcf.codigoSeguridad || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Fecha/Hora Firma</p>
                                    <p className="text-sm">{formatDateTime(selectedEcf.fechaHoraFirma)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Creado</p>
                                    <p className="text-sm">{formatDateTime(selectedEcf.createdAt)}</p>
                                </div>
                            </div>
                            
                            {selectedEcf.trackId && (
                                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground">Track ID</p>
                                    <p className="text-sm font-mono break-all">{selectedEcf.trackId}</p>
                                </div>
                            )}
                            
                            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Archivo</p>
                                <p className="text-sm font-mono break-all">{selectedEcf.fileName}</p>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => {
                                        setIsDetailOpen(false);
                                        previewXml(selectedEcf);
                                    }}
                                >
                                    <FileCode className="h-4 w-4 mr-2" />
                                    Ver XML
                                </Button>
                                <Button 
                                    className="flex-1"
                                    onClick={() => downloadXml(selectedEcf)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* XML Preview Modal */}
            <Dialog open={isXmlPreviewOpen} onOpenChange={setIsXmlPreviewOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileCode className="h-5 w-5 text-primary" />
                            Contenido XML
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEcf?.fileName}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="relative">
                        <pre className="p-4 rounded-lg bg-muted/50 overflow-auto max-h-[50vh] text-xs font-mono whitespace-pre-wrap">
                            {selectedEcf?.xmlContent ? formatXml(selectedEcf.xmlContent) : 'No hay contenido XML disponible'}
                        </pre>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsXmlPreviewOpen(false)}>
                            Cerrar
                        </Button>
                        <Button onClick={() => selectedEcf && downloadXml(selectedEcf)}>
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EcfEmitidos;
