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
    FileText,
    Building2,
    CheckCircle2,
    Clock,
    X,
    FileCode
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
const VERIFACT_API_DIRECT = process.env.REACT_APP_VERIFACT_API_URL || 'https://ecf-test.api.verifact.com.do';
const USE_PROXY = BACKEND_URL && BACKEND_URL.includes('preview.emergentagent.com');
const API_BASE_URL = USE_PROXY ? `${BACKEND_URL}/api` : VERIFACT_API_DIRECT;

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP'
    }).format(amount || 0);
};

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Handle DD-MM-YYYY format
    if (dateString.includes('-') && dateString.length === 10) {
        const [day, month, year] = dateString.split('-');
        return `${day}/${month}/${year}`;
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
    '46': 'Comprobante de Exportación',
    '47': 'Comprobante para Pagos al Exterior'
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
    }
};

const RecepcionEcf = () => {
    const { token } = useAuth();
    
    // State
    const [ecfRecibidos, setEcfRecibidos] = useState([]);
    const [emisorNames, setEmisorNames] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isXmlPreviewOpen, setIsXmlPreviewOpen] = useState(false);
    const [selectedEcf, setSelectedEcf] = useState(null);
    const [xmlContent, setXmlContent] = useState('');

    // Fetch emisor name by RNC
    const fetchEmisorName = useCallback(async (rnc) => {
        if (!token || !rnc || emisorNames[rnc]) return;
        
        try {
            const url = USE_PROXY 
                ? `${API_BASE_URL}/rnc/consultar/${rnc}`
                : `${API_BASE_URL}/api/rnc/consultar-rnc/${rnc}`;
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data?.name) {
                setEmisorNames(prev => ({
                    ...prev,
                    [rnc]: response.data.name
                }));
            }
        } catch (err) {
            console.error('Error fetching emisor name:', err);
        }
    }, [token, emisorNames]);

    // Fetch eCF recibidos
    const fetchEcfRecibidos = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const url = USE_PROXY 
                ? `${API_BASE_URL}/fe/recepcion/ecf/recibidos`
                : `${API_BASE_URL}/fe/recepcion/api/ecf/recibidos/raw`;
            
            const response = await axios.get(url);
            
            if (Array.isArray(response.data)) {
                setEcfRecibidos(response.data);
                
                // Get unique RNCs and fetch their names
                const uniqueRncs = [...new Set(response.data.map(e => e.rncEmisor).filter(Boolean))];
                uniqueRncs.forEach(rnc => {
                    if (!emisorNames[rnc]) {
                        fetchEmisorName(rnc);
                    }
                });
            } else if (response.data.success === false) {
                setError(response.data.message || 'Error al obtener eCF recibidos');
            }
        } catch (err) {
            console.error('Error fetching received eCF:', err);
            setError('Error al cargar los eCF recibidos');
        } finally {
            setIsLoading(false);
        }
    }, [fetchEmisorName, emisorNames]);

    useEffect(() => {
        fetchEcfRecibidos();
    }, [fetchEcfRecibidos]);

    // Filter eCF
    const filteredEcf = ecfRecibidos.filter(ecf => {
        const matchesSearch = searchTerm === '' || 
            ecf.encf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ecf.rncEmisor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ecf.nombreArchivo?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
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

    // Preview XML (simulated - in real implementation would fetch from server)
    const previewXml = (ecf) => {
        setSelectedEcf(ecf);
        // Simulated XML content based on eCF data
        const xmlSample = `<?xml version="1.0" encoding="UTF-8"?>
<ECF xmlns="http://dgii.gov.do/ecf">
  <Encabezado>
    <Version>1.0</Version>
    <RNCEmisor>${ecf.rncEmisor}</RNCEmisor>
    <eNCF>${ecf.encf}</eNCF>
    <TipoeCF>${ecf.tipoECF}</TipoeCF>
    <FechaEmision>${ecf.fechaEmision}</FechaEmision>
  </Encabezado>
  <Totales>
    <MontoTotal>${ecf.montoTotal}</MontoTotal>
  </Totales>
  <FechaHoraFirma>${ecf.fechaRecepcion}</FechaHoraFirma>
</ECF>`;
        setXmlContent(xmlSample);
        setIsXmlPreviewOpen(true);
    };

    // Download XML (simulated)
    const downloadXml = (ecf) => {
        const xmlSample = `<?xml version="1.0" encoding="UTF-8"?>
<ECF xmlns="http://dgii.gov.do/ecf">
  <Encabezado>
    <Version>1.0</Version>
    <RNCEmisor>${ecf.rncEmisor}</RNCEmisor>
    <eNCF>${ecf.encf}</eNCF>
    <TipoeCF>${ecf.tipoECF}</TipoeCF>
    <FechaEmision>${ecf.fechaEmision}</FechaEmision>
  </Encabezado>
  <Totales>
    <MontoTotal>${ecf.montoTotal}</MontoTotal>
  </Totales>
  <FechaHoraFirma>${ecf.fechaRecepcion}</FechaHoraFirma>
</ECF>`;
        
        const blob = new Blob([xmlSample], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ecf.nombreArchivo || `${ecf.encf}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Archivo XML descargado');
    };

    // Calculate stats
    const stats = {
        total: ecfRecibidos.length,
        recibidos: ecfRecibidos.filter(e => e.estado === 'Recibido').length,
        montoTotal: ecfRecibidos.reduce((sum, e) => sum + (e.montoTotal || 0), 0)
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
                            Recepción eCF
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Comprobantes fiscales electrónicos recibidos
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchEcfRecibidos}
                    disabled={isLoading}
                    data-testid="refresh-ecf-btn"
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

            {/* Search */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="search">Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="eNCF, RNC emisor, archivo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
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
                    <CardTitle>eCF Recibidos</CardTitle>
                    <CardDescription>
                        {filteredEcf.length} comprobante(s) encontrado(s)
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
                                        <TableHead>eNCF</TableHead>
                                        <TableHead>RNC Emisor</TableHead>
                                        <TableHead>Emisor</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead>Emisión</TableHead>
                                        <TableHead>Recepción</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="w-[140px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEcf.map((ecf) => (
                                        <TableRow key={ecf.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-mono font-medium">{ecf.encf}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono">
                                                {ecf.rncEmisor}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-sm font-medium truncate max-w-[200px]" title={emisorNames[ecf.rncEmisor] || 'Cargando...'}>
                                                        {emisorNames[ecf.rncEmisor] || 'Cargando...'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm" title={tipoEcfMap[ecf.tipoECF] || ecf.tipoECF}>
                                                    {ecf.tipoECF}
                                                </span>
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
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openDetail(ecf)}
                                                        className="h-8 w-8"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => previewXml(ecf)}
                                                        className="h-8 w-8"
                                                        title="Previsualizar XML"
                                                    >
                                                        <FileCode className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => downloadXml(ecf)}
                                                        className="h-8 w-8"
                                                        title="Descargar XML"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
                            Detalle de eCF Recibido
                        </DialogTitle>
                        <DialogDescription>
                            Información completa del comprobante electrónico
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedEcf && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                <div>
                                    <p className="text-sm text-muted-foreground">eNCF</p>
                                    <p className="text-lg font-mono font-bold">{selectedEcf.encf}</p>
                                </div>
                                {getStatusBadge(selectedEcf.estado)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">RNC Emisor</p>
                                    <p className="text-sm font-mono">{selectedEcf.rncEmisor}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Tipo eCF</p>
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
                                <div className="space-y-1 col-span-2">
                                    <p className="text-xs text-muted-foreground">Fecha Recepción</p>
                                    <p className="text-sm">{formatDateTime(selectedEcf.fechaRecepcion)}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Archivo</p>
                                <p className="text-sm font-mono break-all">{selectedEcf.nombreArchivo}</p>
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
                <DialogContent className="sm:max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileCode className="h-5 w-5 text-primary" />
                            Vista Previa XML
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEcf?.nombreArchivo}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="relative">
                        <pre className="p-4 rounded-lg bg-muted/50 overflow-auto max-h-[50vh] text-xs font-mono whitespace-pre-wrap">
                            {xmlContent}
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

export default RecepcionEcf;
