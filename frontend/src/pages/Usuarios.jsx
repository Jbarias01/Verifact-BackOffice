import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, 
    UserPlus,
    Search,
    RefreshCw,
    Loader2,
    Mail,
    Shield,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Edit,
    Eye,
    EyeOff
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

import { apiUrl, USE_PROXY } from '@/lib/api';

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

// Helper to format datetime
const formatDateTime = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('es-DO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const Usuarios = () => {
    const { token } = useAuth();
    
    // State
    const [usuarios, setUsuarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nombre: '',
        rol: 'Usuario',
        esActivo: true
    });

    // Fetch users
    const fetchUsuarios = useCallback(async () => {
        if (!token) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const url = apiUrl(`usuarios`);
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (Array.isArray(response.data)) {
                setUsuarios(response.data);
            } else if (response.data.success === false) {
                setError(response.data.message || 'Error al obtener usuarios');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            if (err.response?.status === 401) {
                setError('No autorizado. Verifique sus permisos o inicie sesión nuevamente.');
            } else {
                setError('Error al cargar los usuarios');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    // Filter users
    const filteredUsuarios = usuarios.filter(user => {
        const matchesSearch = searchTerm === '' || 
            user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.rol?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Reset form
    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            nombre: '',
            rol: 'Usuario',
            esActivo: true
        });
        setShowPassword(false);
    };

    // Open create modal
    const openCreateModal = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    // Open edit modal
    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            email: user.email || '',
            password: '',
            nombre: user.nombre || '',
            rol: user.rol || 'Usuario',
            esActivo: user.esActivo !== false
        });
        setIsEditOpen(true);
    };

    // Open view modal
    const openViewModal = (user) => {
        setSelectedUser(user);
        setIsViewOpen(true);
    };

    // Handle create user
    const handleCreate = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password || !formData.nombre || !formData.rol) {
            toast.error('Complete todos los campos requeridos');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const url = apiUrl(`usuarios`);
            
            const response = await axios.post(url, {
                email: formData.email,
                password: formData.password,
                nombre: formData.nombre,
                rol: formData.rol
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.id) {
                toast.success('Usuario creado exitosamente');
                setIsCreateOpen(false);
                resetForm();
                fetchUsuarios();
            } else if (response.data.success === false) {
                toast.error(response.data.message || 'Error al crear usuario');
            }
        } catch (err) {
            console.error('Error creating user:', err);
            toast.error(err.response?.data?.detail || 'Error al crear el usuario');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle update user
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.nombre || !formData.rol) {
            toast.error('Complete todos los campos requeridos');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const url = apiUrl(`usuarios/${selectedUser.id}`);
            
            const updateData = {
                email: formData.email,
                nombre: formData.nombre,
                rol: formData.rol,
                esActivo: formData.esActivo
            };
            
            // Only include password if provided
            if (formData.password) {
                updateData.password = formData.password;
            }
            
            const response = await axios.put(url, updateData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.id) {
                toast.success('Usuario actualizado exitosamente');
                setIsEditOpen(false);
                resetForm();
                fetchUsuarios();
            } else if (response.data.success === false) {
                toast.error(response.data.message || 'Error al actualizar usuario');
            }
        } catch (err) {
            console.error('Error updating user:', err);
            toast.error(err.response?.data?.detail || 'Error al actualizar el usuario');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate stats
    const stats = {
        total: usuarios.length,
        activos: usuarios.filter(u => u.esActivo !== false).length,
        inactivos: usuarios.filter(u => u.esActivo === false).length,
        admins: usuarios.filter(u => u.rol?.toLowerCase() === 'admin').length
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
                            Gestión de Usuarios
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Administre los usuarios del sistema
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={openCreateModal} data-testid="create-user-btn">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Nuevo Usuario
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={fetchUsuarios}
                        disabled={isLoading}
                        data-testid="refresh-users-btn"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total</p>
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
                                <p className="text-xs text-muted-foreground">Inactivos</p>
                                <p className="text-xl font-bold text-muted-foreground">{stats.inactivos}</p>
                            </div>
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Admins</p>
                                <p className="text-xl font-bold text-info">{stats.admins}</p>
                            </div>
                            <Shield className="h-5 w-5 text-info" />
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
                                    placeholder="Nombre, email o rol..."
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

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Usuarios</CardTitle>
                    <CardDescription>
                        {filteredUsuarios.length} usuario(s) encontrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredUsuarios.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No se encontraron usuarios
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Último Login</TableHead>
                                        <TableHead>Creación</TableHead>
                                        <TableHead className="w-[100px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsuarios.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.nombre}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    {user.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.rol?.toLowerCase() === 'admin' ? 'default' : 'secondary'}>
                                                    {user.rol}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.esActivo !== false ? (
                                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Activo
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Inactivo
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDateTime(user.ultimoLogin)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(user.fechaCreacion)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openViewModal(user)}
                                                        className="h-8 w-8"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditModal(user)}
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

            {/* Create User Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Nuevo Usuario
                        </DialogTitle>
                        <DialogDescription>
                            Complete los datos para crear un nuevo usuario
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre Completo *</Label>
                            <Input
                                id="nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                placeholder="Juan Pérez"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="usuario@empresa.com"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="••••••••"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="rol">Rol *</Label>
                            <Select value={formData.rol} onValueChange={(value) => setFormData({...formData, rol: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Admin">Administrador</SelectItem>
                                    <SelectItem value="Usuario">Usuario</SelectItem>
                                    <SelectItem value="Contador">Contador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Crear Usuario
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-primary" />
                            Editar Usuario
                        </DialogTitle>
                        <DialogDescription>
                            Modifique los datos del usuario
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-nombre">Nombre Completo *</Label>
                            <Input
                                id="edit-nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                placeholder="Juan Pérez"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Correo Electrónico *</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="usuario@empresa.com"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="edit-password">Nueva Contraseña (dejar vacío para mantener)</Label>
                            <div className="relative">
                                <Input
                                    id="edit-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="••••••••"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="edit-rol">Rol *</Label>
                            <Select value={formData.rol} onValueChange={(value) => setFormData({...formData, rol: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Admin">Administrador</SelectItem>
                                    <SelectItem value="Usuario">Usuario</SelectItem>
                                    <SelectItem value="Contador">Contador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="space-y-0.5">
                                <Label htmlFor="esActivo">Estado del Usuario</Label>
                                <p className="text-xs text-muted-foreground">
                                    {formData.esActivo ? 'Usuario activo' : 'Usuario inactivo'}
                                </p>
                            </div>
                            <Switch
                                id="esActivo"
                                checked={formData.esActivo}
                                onCheckedChange={(checked) => setFormData({...formData, esActivo: checked})}
                            />
                        </div>
                        
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View User Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Detalle de Usuario
                        </DialogTitle>
                        <DialogDescription>
                            Información completa del usuario
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                                <div>
                                    <p className="text-sm text-muted-foreground">Nombre</p>
                                    <p className="text-lg font-bold">{selectedUser.nombre}</p>
                                </div>
                                {selectedUser.esActivo !== false ? (
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                        Activo
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                                        Inactivo
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="text-sm font-medium">{selectedUser.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Rol</p>
                                    <Badge variant={selectedUser.rol?.toLowerCase() === 'admin' ? 'default' : 'secondary'}>
                                        {selectedUser.rol}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Último Login</p>
                                    <p className="text-sm">{formatDateTime(selectedUser.ultimoLogin)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Fecha Creación</p>
                                    <p className="text-sm">{formatDate(selectedUser.fechaCreacion)}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">ID de Usuario</p>
                                <p className="text-xs font-mono break-all text-muted-foreground">{selectedUser.id}</p>
                            </div>
                            
                            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">ID de Cliente</p>
                                <p className="text-xs font-mono break-all text-muted-foreground">{selectedUser.clienteId}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Usuarios;
