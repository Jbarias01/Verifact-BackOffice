import React, { useState, useEffect, useCallback } from 'react';
import { 
    Building2, 
    Plus,
    RefreshCw,
    Loader2,
    MapPin,
    Phone,
    Hash,
    CheckCircle2,
    XCircle,
    Star,
    Calendar,
    Search
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

const Sucursales = () => {
    const { token } = useAuth();
    
    // State
    const [sucursales, setSucursales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        direccion: '',
        telefono: '',
        esPrincipal: false
    });

    // Fetch sucursales
    const fetchSucursales = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const url = USE_PROXY 
                ? `${API_BASE_URL}/sucursales`
                : `${API_BASE_URL}/api/sucursales`;
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (Array.isArray(response.data)) {
                setSucursales(response.data);
            }
        } catch (err) {
            console.error('Error fetching sucursales:', err);
            if (err.response?.status === 401) {
                setError('No autorizado. Verifique sus permisos.');
            } else {
                setError('Error al cargar las sucursales');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSucursales();
    }, [fetchSucursales]);

    // Filter sucursales
    const filteredSucursales = sucursales.filter(suc => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            suc.nombre?.toLowerCase().includes(term) ||
            suc.codigo?.toLowerCase().includes(term) ||
            suc.direccion?.toLowerCase().includes(term)
        );
    });

    // Handle form change
    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            nombre: '',
            codigo: '',
            direccion: '',
            telefono: '',
            esPrincipal: false
        });
    };

    // Create sucursal
    const handleCreate = async () => {
        if (!formData.nombre.trim()) {
            toast.error('El nombre es requerido');
            return;
        }
        if (!formData.codigo.trim()) {
            toast.error('El código es requerido');
            return;
        }

        setIsCreating(true);
        
        try {
            const url = USE_PROXY 
                ? `${API_BASE_URL}/sucursales`
                : `${API_BASE_URL}/api/sucursales`;
            
            await axios.post(url, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            toast.success('Sucursal creada exitosamente');
            setIsCreateModalOpen(false);
            resetForm();
            fetchSucursales();
        } catch (err) {
            console.error('Error creating sucursal:', err);
            const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Error al crear la sucursal';
            toast.error(errorMsg);
        } finally {
            setIsCreating(false);
        }
    };

    // Calculate stats
    const stats = {
        total: sucursales.length,
        activas: sucursales.filter(s => s.esActivo).length,
        principal: sucursales.find(s => s.esPrincipal)
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
                            Sucursales
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gestión de sucursales de la empresa
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={fetchSucursales}
                        disabled={isLoading}
                        data-testid="refresh-sucursales-btn"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Actualizar
                    </Button>
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        data-testid="create-sucursal-btn"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Sucursal
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Sucursales</p>
                                <p className="text-xl font-bold text-foreground">{stats.total}</p>
                            </div>
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Activas</p>
                                <p className="text-xl font-bold text-success">{stats.activas}</p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Sucursal Principal</p>
                            <p className="text-sm font-bold text-foreground truncate">
                                {stats.principal?.nombre || 'N/A'}
                            </p>
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
                            placeholder="Buscar por nombre, código o dirección..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="search-sucursales-input"
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

            {/* Sucursales Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Sucursales</CardTitle>
                    <CardDescription>
                        {filteredSucursales.length} de {sucursales.length} sucursal(es)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredSucursales.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No se encontraron sucursales
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Dirección</TableHead>
                                        <TableHead>Teléfono</TableHead>
                                        <TableHead>Principal</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Creación</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSucursales.map((sucursal) => (
                                        <TableRow key={sucursal.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-mono font-medium">{sucursal.codigo}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{sucursal.nombre}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {sucursal.direccion ? (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-sm truncate max-w-[200px]" title={sucursal.direccion}>
                                                            {sucursal.direccion}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {sucursal.telefono ? (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{sucursal.telefono}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {sucursal.esPrincipal ? (
                                                    <Badge className="bg-warning/10 text-warning border-warning/20">
                                                        <Star className="h-3 w-3 mr-1 fill-current" />
                                                        Principal
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {sucursal.esActivo ? (
                                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Activa
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Inactiva
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDate(sucursal.fechaCreacion)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Nueva Sucursal
                        </DialogTitle>
                        <DialogDescription>
                            Ingrese los datos de la nueva sucursal
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre *</Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: SUCURSAL NORTE"
                                value={formData.nombre}
                                onChange={(e) => handleFormChange('nombre', e.target.value.toUpperCase())}
                                data-testid="input-nombre"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="codigo">Código *</Label>
                            <Input
                                id="codigo"
                                placeholder="Ej: SUC002"
                                value={formData.codigo}
                                onChange={(e) => handleFormChange('codigo', e.target.value.toUpperCase())}
                                data-testid="input-codigo"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="direccion">Dirección</Label>
                            <Input
                                id="direccion"
                                placeholder="Ej: Av. Principal #123"
                                value={formData.direccion}
                                onChange={(e) => handleFormChange('direccion', e.target.value)}
                                data-testid="input-direccion"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                                id="telefono"
                                placeholder="Ej: 809-555-1234"
                                value={formData.telefono}
                                onChange={(e) => handleFormChange('telefono', e.target.value)}
                                data-testid="input-telefono"
                            />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <div className="space-y-0.5">
                                <Label htmlFor="esPrincipal">Sucursal Principal</Label>
                                <p className="text-xs text-muted-foreground">
                                    Marcar como sucursal principal
                                </p>
                            </div>
                            <Switch
                                id="esPrincipal"
                                checked={formData.esPrincipal}
                                onCheckedChange={(checked) => handleFormChange('esPrincipal', checked)}
                                data-testid="switch-esPrincipal"
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                resetForm();
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleCreate}
                            disabled={isCreating}
                            data-testid="submit-create-sucursal"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Crear Sucursal
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Sucursales;
