import React, { useState, useEffect, useCallback } from 'react';
import { 
    FileText, 
    Search,
    Calendar as CalendarIcon,
    RefreshCw,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    Download,
    Eye,
    Building2,
    Hash,
    DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import { cn } from '@/lib/utils';
import axios from 'axios';

// API URL Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const VERIFACT_API_DIRECT = process.env.REACT_APP_VERIFACT_API_URL || 'https://ecf-test.api.verifact.com.do';
const USE_PROXY = BACKEND_URL && BACKEND_URL.includes('preview.emergentagent.com');
const API_BASE_URL = USE_PROXY ? `${BACKEND_URL}/api` : VERIFACT_API_DIRECT;

// Helper to format date for display (dd-MM-yyyy)
const formatDateDisplay = (date) => {
    if (!date) return '';
    return format(date, 'dd-MM-yyyy');
};

// Helper to format datetime for table display
const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'dd-MM-yyyy HH:mm', { locale: es });
};

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP'
    }).format(amount);
};

// Helper to format date for API (MM-DD-YYYY - el API espera este formato)
const formatDateForApi = (date) => {
    return format(date, 'MM-dd-yyyy');
};

// Get today's date
const getToday = () => {
    return new Date();
};

const statusConfig = {
    'Aceptado': { 
        label: 'Aceptado', 
        icon: CheckCircle2,
        className: 'bg-success/10 text-success border-success/20',
        description: 'Factura validada correctamente y totalmente válida'
    },
    'AceptadoCondicional': { 
        label: 'Aceptado Condicional', 
        icon: AlertTriangle,
        className: 'bg-warning/10 text-warning border-warning/20',
        description: 'Válida con requisitos mínimos, corregir errores futuros'
    },
    'Aceptado Condicional': { 
        label: 'Aceptado Condicional', 
        icon: AlertTriangle,
        className: 'bg-warning/10 text-warning border-warning/20',
        description: 'Válida con requisitos mínimos, corregir errores futuros'
    },
    'EnProceso': { 
        label: 'En Proceso', 
        icon: Loader2,
        className: 'bg-info/10 text-info border-info/20',
        description: 'DGII está validando el documento'
    },
    'En Proceso': { 
        label: 'En Proceso', 
        icon: Loader2,
        className: 'bg-info/10 text-info border-info/20',
        description: 'DGII está validando el documento'
    },
    'Rechazado': { 
        label: 'Rechazado', 
        icon: XCircle,
        className: 'bg-destructive/10 text-destructive border-destructive/20',
        description: 'Documento con errores, debe corregirse'
    },
};

// DatePicker Component
const DatePicker = ({ date, onSelect, label }) => {
    const [open, setOpen] = useState(false);
    
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? formatDateDisplay(date) : "Seleccionar fecha"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                            onSelect(newDate);
                            setOpen(false);
                        }}
                        initialFocus
                        locale={es}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};

const Facturas = () => {
    const { token } = useAuth();
    const [facturas, setFacturas] = useState([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filters - Default to today's date
    const [fechaInicio, setFechaInicio] = useState(getToday());
    const [fechaFin, setFechaFin] = useState(getToday());
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Detail modal
    const [selectedFactura, setSelectedFactura] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const fetchFacturas = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const url = USE_PROXY 
                ? `${API_BASE_URL}/facturas/getfacturaselectronicas`
                : `${API_BASE_URL}/api/facturas/getfacturaselectronicas`;
            
            const response = await axios.get(url, {
                params: {
                    fechaInicio: formatDateForApi(fechaInicio),
                    fechaFin: formatDateForApi(fechaFin)
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data) {
                setFacturas(response.data.facturas || []);
                setTotal(response.data.total || 0);
            }
        } catch (err) {
            console.error('Error fetching invoices:', err);
            if (err.response?.status === 401) {
                setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
            } else {
                setError('Error al cargar las facturas');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, fechaInicio, fechaFin]);

    // Fetch facturas on mount and when dates change
    useEffect(() => {
        fetchFacturas();
    }, [fetchFacturas]);

    // Filter facturas based on status and search term
    const filteredFacturas = facturas.filter(factura => {
        const matchesStatus = statusFilter === 'all' || factura.estado === statusFilter;
        const matchesSearch = searchTerm === '' || 
            factura.e_NCF?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            factura.razonSocialComprador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            factura.rncComprador?.includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    // Calculate stats
    const stats = {
        total: facturas.length,
        aceptadas: facturas.filter(f => f.estado === 'Aceptado').length,
        aceptadasCondicional: facturas.filter(f => f.estado === 'AceptadoCondicional' || f.estado === 'Aceptado Condicional').length,
        enProceso: facturas.filter(f => f.estado === 'EnProceso' || f.estado === 'En Proceso').length,
        rechazadas: facturas.filter(f => f.estado === 'Rechazado').length,
        montoTotal: facturas.reduce((sum, f) => sum + (f.monto || 0), 0)
    };

    const getStatusBadge = (estado) => {
        const config = statusConfig[estado] || { 
            label: estado || 'Desconocido', 
            icon: Clock,
            className: 'bg-muted text-muted-foreground border-muted' 
        };
        const Icon = config.icon;
        
        return (
            <Badge variant="outline" className={cn("font-medium", config.className)}>
                <Icon className={cn("h-3 w-3 mr-1", estado === 'EnProceso' || estado === 'En Proceso' ? 'animate-spin' : '')} />
                {config.label}
            </Badge>
        );
    };

    const openDetail = (factura) => {
        setSelectedFactura(factura);
        setIsDetailOpen(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        Gestión de Facturas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Consulta y gestiona tus facturas electrónicas
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchFacturas}
                    disabled={isLoading}
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Actualizar
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total</p>
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
                                <p className="text-xs text-muted-foreground">Aceptadas</p>
                                <p className="text-xl font-bold text-success">{stats.aceptadas}</p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Condicional</p>
                                <p className="text-xl font-bold text-warning">{stats.aceptadasCondicional}</p>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-warning" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">En Proceso</p>
                                <p className="text-xl font-bold text-info">{stats.enProceso}</p>
                            </div>
                            <Loader2 className="h-5 w-5 text-info" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Rechazadas</p>
                                <p className="text-xl font-bold text-destructive">{stats.rechazadas}</p>
                            </div>
                            <XCircle className="h-5 w-5 text-destructive" />
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
                        <DatePicker
                            date={fechaInicio}
                            onSelect={setFechaInicio}
                            label="Fecha Desde"
                        />
                        <DatePicker
                            date={fechaFin}
                            onSelect={setFechaFin}
                            label="Fecha Hasta"
                        />
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
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
                        <div className="space-y-2 lg:col-span-2">
                            <Label htmlFor="search">Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="NCF, cliente, RNC..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button onClick={fetchFacturas} disabled={isLoading}>
                            <Search className="h-4 w-4 mr-2" />
                            Buscar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Facturas Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Facturas Electrónicas</CardTitle>
                    <CardDescription>
                        {filteredFacturas.length} factura(s) encontrada(s) del {formatDateDisplay(fechaInicio)} al {formatDateDisplay(fechaFin)}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Cargando facturas...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                            <p className="text-destructive font-medium">{error}</p>
                            <Button 
                                variant="outline" 
                                onClick={fetchFacturas}
                                className="mt-4"
                            >
                                Reintentar
                            </Button>
                        </div>
                    ) : filteredFacturas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                No se encontraron facturas
                            </h3>
                            <p className="text-muted-foreground mb-4 max-w-md">
                                No hay facturas electrónicas para el día {formatDateDisplay(fechaInicio)}. Intenta cambiar el rango de fechas.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>e-NCF</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>RNC Comprador</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead>Fecha Emisión</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="w-[80px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredFacturas.map((factura) => (
                                        <TableRow key={factura.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-mono font-medium">{factura.e_NCF}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="font-medium">
                                                        {factura.razonSocialComprador}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-mono">
                                                {factura.rncComprador}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(factura.monto)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDateTime(factura.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(factura.estado)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openDetail(factura)}
                                                    className="h-8 w-8"
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
                            Detalle de Factura
                        </DialogTitle>
                        <DialogDescription>
                            Información completa de la factura electrónica
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedFactura && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                <div>
                                    <p className="text-sm text-muted-foreground">e-NCF</p>
                                    <p className="text-lg font-mono font-bold">{selectedFactura.e_NCF}</p>
                                </div>
                                {getStatusBadge(selectedFactura.estado)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Cliente</p>
                                    <p className="text-sm font-medium">{selectedFactura.razonSocialComprador}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">RNC Comprador</p>
                                    <p className="text-sm font-mono">{selectedFactura.rncComprador}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">RNC Emisor</p>
                                    <p className="text-sm font-mono">{selectedFactura.rnc}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Monto</p>
                                    <p className="text-sm font-bold text-primary">{formatCurrency(selectedFactura.monto)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Fecha Creación</p>
                                    <p className="text-sm">{formatDateTime(selectedFactura.createdAt)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Fecha Recepción</p>
                                    <p className="text-sm">{formatDateTime(selectedFactura.fechaRecepcion)}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Archivo XML</p>
                                <p className="text-sm font-mono break-all">{selectedFactura.fileName}</p>
                            </div>
                            
                            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Track ID</p>
                                <p className="text-xs font-mono break-all text-muted-foreground">{selectedFactura.trackId}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Facturas;
