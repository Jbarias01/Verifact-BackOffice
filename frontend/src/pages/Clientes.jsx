import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, 
    Plus,
    RefreshCw,
    Loader2,
    MapPin,
    Phone,
    Mail,
    Hash,
    CheckCircle2,
    XCircle,
    Search,
    Eye,
    Edit,
    CreditCard,
    Calendar,
    Building2,
    IdCard
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 0
    }).format(amount || 0);
};

const Clientes = () => {
    const { token, user } = useAuth();
    
    // State
    const [clientes, setClientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
    const [selectedCliente, setSelectedCliente] = useState(null);
    
    // Form state
    const initialFormData = {
        codigoInterno: '',
        nombre: '',
        cedulaRnc: '',
        telefono: '',
        email: '',
        direccion: '',
        creditoHabilitado: false,
        limiteCredito: 0,
        diasCredito: 0,
        esActivo: true
    };
    const [formData, setFormData] = useState(initialFormData);

    // Fetch clientes
    const fetchClientes = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const url = USE_PROXY 
                ? `${API_BASE_URL}/clientes/lista`
                : `${API_BASE_URL}/api/clientes`;
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (Array.isArray(response.data)) {
                setClientes(response.data);
            }
        } catch (err) {
            console.error('Error fetching clientes:', err);
            if (err.response?.status === 401) {
                setError('No autorizado. Verifique sus permisos.');
            } else {
                setError('Error al cargar los clientes');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchClientes();
    }, [fetchClientes]);

    // Filter clientes
    const filteredClientes = clientes.filter(cliente => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            cliente.nombre?.toLowerCase().includes(term) ||
            cliente.codigoInterno?.toLowerCase().includes(term) ||
            cliente.cedulaRnc?.toLowerCase().includes(term) ||
            cliente.email?.toLowerCase().includes(term) ||
            cliente.telefono?.toLowerCase().includes(term)
        );
    });

    // Handle form change
    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Reset form
    const resetForm = () => {
        setFormData(initialFormData);
        setEditingCliente(null);
    };

    // Open create modal
    const openCreateModal = () => {
        resetForm();
        setIsFormModalOpen(true);
    };

    // Open edit modal
    const openEditModal = async (cliente) => {
        setEditingCliente(cliente);
        setFormData({
            codigoInterno: cliente.codigoInterno || '',
            nombre: cliente.nombre || '',
            cedulaRnc: cliente.cedulaRnc || '',
            telefono: cliente.telefono || '',
            email: cliente.email || '',
            direccion: cliente.direccion || '',
            creditoHabilitado: cliente.creditoHabilitado || false,
            limiteCredito: cliente.limiteCredito || 0,
            diasCredito: cliente.diasCredito || 0,
            esActivo: cliente.esActivo !== false
        });
        setIsFormModalOpen(true);
    };

    // Open detail modal
    const openDetailModal = async (cliente) => {
        try {
            const url = USE_PROXY 
                ? `${API_BASE_URL}/clientes/lista/${cliente.id}`
                : `${API_BASE_URL}/api/clientes/${cliente.id}`;
            
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSelectedCliente(response.data);
            setIsDetailModalOpen(true);
        } catch (err) {
            console.error('Error fetching cliente details:', err);
            // Use the cliente from list if detail fetch fails
            setSelectedCliente(cliente);
            setIsDetailModalOpen(true);
        }
    };

    // Save cliente (create or update)
    const handleSave = async () => {
        if (!formData.nombre.trim()) {
            toast.error('El nombre es requerido');
            return;
        }
        if (!formData.cedulaRnc.trim()) {
            toast.error('La Cédula/RNC es requerida');
            return;
        }

        setIsSaving(true);
        
        try {
            const payload = {
                ...formData,
                limiteCredito: Number(formData.limiteCredito) || 0,
                diasCredito: Number(formData.diasCredito) || 0
            };

            if (editingCliente) {
                // Update
                const url = USE_PROXY 
                    ? `${API_BASE_URL}/clientes/lista/${editingCliente.id}`
                    : `${API_BASE_URL}/api/clientes/${editingCliente.id}`;
                
                await axios.put(url, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                toast.success('Cliente actualizado exitosamente');
            } else {
                // Create
                const url = USE_PROXY 
                    ? `${API_BASE_URL}/clientes/lista`
                    : `${API_BASE_URL}/api/clientes`;
                
                await axios.post(url, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                toast.success('Cliente creado exitosamente');
            }
            
            setIsFormModalOpen(false);
            resetForm();
            fetchClientes();
        } catch (err) {
            console.error('Error saving cliente:', err);
            const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Error al guardar el cliente';
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate stats
    const stats = {
        total: clientes.length,
        activos: clientes.filter(c => c.esActivo).length,
        conCredito: clientes.filter(c => c.creditoHabilitado).length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Clientes
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gestión de clientes de la empresa
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={fetchClientes}
                        disabled={isLoading}
                        data-testid="refresh-clientes-btn"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Actualizar
                    </Button>
                    <Button 
                        onClick={openCreateModal}
                        data-testid="create-cliente-btn"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Clientes</p>
                                <p className="text-xl font-bold text-foreground">{stats.total}</p>
                            </div>
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Activos</p>
                                <p className="text-xl font-bold text-success">{stats.activos}</p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Con Crédito</p>
                                <p className="text-xl font-bold text-accent">{stats.conCredito}</p>
                            </div>
                            <CreditCard className="h-5 w-5 text-accent" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-4 pb-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, código, RNC, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="search-clientes-input"
                        />
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

            {/* Clientes Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Clientes</CardTitle>
                    <CardDescription>
                        {filteredClientes.length} de {clientes.length} cliente(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredClientes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No se encontraron clientes
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Cédula/RNC</TableHead>
                                        <TableHead>Teléfono</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Crédito</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="w-[100px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClientes.map((cliente) => (
                                        <TableRow key={cliente.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-mono text-sm">{cliente.codigoInterno}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{cliente.nombre}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <IdCard className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-mono text-sm">{cliente.cedulaRnc}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {cliente.telefono && cliente.telefono !== 'N/A' ? (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{cliente.telefono}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {cliente.email && cliente.email !== 'N/A' ? (
                                                    <span className="text-sm">{cliente.email}</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {cliente.creditoHabilitado ? (
                                                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                                                        <CreditCard className="h-3 w-3 mr-1" />
                                                        {formatCurrency(cliente.limiteCredito)}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">Sin crédito</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {cliente.esActivo ? (
                                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Activo
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Inactivo
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openDetailModal(cliente)}
                                                        className="h-8 w-8"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditModal(cliente)}
                                                        className="h-8 w-8"
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-4 w-4" />
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

            {/* Create/Edit Modal */}
            <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCliente ? 'Modifique los datos del cliente' : 'Ingrese los datos del nuevo cliente'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="codigoInterno">Código Interno</Label>
                                <Input
                                    id="codigoInterno"
                                    placeholder="CLI-00000001"
                                    value={formData.codigoInterno}
                                    onChange={(e) => handleFormChange('codigoInterno', e.target.value)}
                                    data-testid="input-codigo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cedulaRnc">Cédula/RNC *</Label>
                                <Input
                                    id="cedulaRnc"
                                    placeholder="000-0000000-0"
                                    value={formData.cedulaRnc}
                                    onChange={(e) => handleFormChange('cedulaRnc', e.target.value)}
                                    data-testid="input-rnc"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre *</Label>
                            <Input
                                id="nombre"
                                placeholder="Nombre del cliente"
                                value={formData.nombre}
                                onChange={(e) => handleFormChange('nombre', e.target.value.toUpperCase())}
                                data-testid="input-nombre"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="telefono">Teléfono</Label>
                                <Input
                                    id="telefono"
                                    placeholder="(809) 000-0000"
                                    value={formData.telefono}
                                    onChange={(e) => handleFormChange('telefono', e.target.value)}
                                    data-testid="input-telefono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="cliente@email.com"
                                    value={formData.email}
                                    onChange={(e) => handleFormChange('email', e.target.value)}
                                    data-testid="input-email"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="direccion">Dirección</Label>
                            <Input
                                id="direccion"
                                placeholder="Dirección del cliente"
                                value={formData.direccion}
                                onChange={(e) => handleFormChange('direccion', e.target.value)}
                                data-testid="input-direccion"
                            />
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium mb-3">Configuración de Crédito</h4>
                            
                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 mb-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="creditoHabilitado">Crédito Habilitado</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Permitir ventas a crédito
                                    </p>
                                </div>
                                <Switch
                                    id="creditoHabilitado"
                                    checked={formData.creditoHabilitado}
                                    onCheckedChange={(checked) => handleFormChange('creditoHabilitado', checked)}
                                    data-testid="switch-credito"
                                />
                            </div>

                            {formData.creditoHabilitado && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="limiteCredito">Límite de Crédito (RD$)</Label>
                                        <Input
                                            id="limiteCredito"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={formData.limiteCredito}
                                            onChange={(e) => handleFormChange('limiteCredito', e.target.value)}
                                            data-testid="input-limite"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="diasCredito">Días de Crédito</Label>
                                        <Input
                                            id="diasCredito"
                                            type="number"
                                            min="0"
                                            placeholder="30"
                                            value={formData.diasCredito}
                                            onChange={(e) => handleFormChange('diasCredito', e.target.value)}
                                            data-testid="input-dias"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {editingCliente && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                                <div className="space-y-0.5">
                                    <Label htmlFor="esActivo">Cliente Activo</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Habilitar o deshabilitar cliente
                                    </p>
                                </div>
                                <Switch
                                    id="esActivo"
                                    checked={formData.esActivo}
                                    onCheckedChange={(checked) => handleFormChange('esActivo', checked)}
                                    data-testid="switch-activo"
                                />
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsFormModalOpen(false);
                                resetForm();
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={isSaving}
                            data-testid="submit-cliente"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    {editingCliente ? 'Actualizar' : 'Crear'} Cliente
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Detalle del Cliente
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedCliente && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                <div>
                                    <p className="text-sm text-muted-foreground">Código</p>
                                    <p className="text-lg font-mono font-bold">{selectedCliente.codigoInterno}</p>
                                </div>
                                {selectedCliente.esActivo ? (
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                        Activo
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                        Inactivo
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <p className="text-xs text-muted-foreground">Nombre</p>
                                <p className="text-lg font-bold">{selectedCliente.nombre}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <IdCard className="h-3 w-3" /> Cédula/RNC
                                    </p>
                                    <p className="text-sm font-mono">{selectedCliente.cedulaRnc}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> Teléfono
                                    </p>
                                    <p className="text-sm">{selectedCliente.telefono || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> Email
                                    </p>
                                    <p className="text-sm">{selectedCliente.email || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Fecha Creación
                                    </p>
                                    <p className="text-sm">{formatDate(selectedCliente.fechaCreacion)}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Dirección
                                </p>
                                <p className="text-sm">{selectedCliente.direccion || 'N/A'}</p>
                            </div>

                            {selectedCliente.sucursal && (
                                <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Building2 className="h-3 w-3" /> Sucursal
                                    </p>
                                    <p className="text-sm font-medium">{selectedCliente.sucursal.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{selectedCliente.sucursal.codigo}</p>
                                </div>
                            )}
                            
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" /> Información de Crédito
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Estado</p>
                                        <p className={cn(
                                            "text-sm font-medium",
                                            selectedCliente.creditoHabilitado ? "text-success" : "text-muted-foreground"
                                        )}>
                                            {selectedCliente.creditoHabilitado ? 'Habilitado' : 'Deshabilitado'}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Límite</p>
                                        <p className="text-sm font-bold">{formatCurrency(selectedCliente.limiteCredito)}</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Días</p>
                                        <p className="text-sm font-bold">{selectedCliente.diasCredito || 0}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => {
                                        setIsDetailModalOpen(false);
                                        openEditModal(selectedCliente);
                                    }}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => setIsDetailModalOpen(false)}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Clientes;
