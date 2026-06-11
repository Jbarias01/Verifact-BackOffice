import React, { useState } from 'react';
import { 
    Settings, 
    Lock,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle2,
    Shield,
    User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

import { apiUrl, USE_PROXY } from '@/lib/api';

const Configuracion = () => {
    const { token, user } = useAuth();
    
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Handle password change
    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        // Validations
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Complete todos los campos');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas nuevas no coinciden');
            return;
        }
        
        if (newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        if (!user?.id) {
            toast.error('Error: No se pudo identificar el usuario');
            return;
        }
        
        setIsChangingPassword(true);
        
        try {
            const url = apiUrl(`usuarios/${user.id}/password`);
            
            const response = await axios.post(url, {
                currentPassword,
                newPassword
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                toast.success('Contraseña actualizada exitosamente');
                // Clear form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(response.data.message || 'Error al cambiar la contraseña');
            }
        } catch (err) {
            console.error('Error changing password:', err);
            toast.error(err.response?.data?.detail || 'Error al cambiar la contraseña');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Settings className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Configuración
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Administre su cuenta y preferencias
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* User Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Información de Usuario
                        </CardTitle>
                        <CardDescription>Sus datos de cuenta actual</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                                <span className="text-sm text-muted-foreground">Nombre</span>
                                <span className="font-medium">{user?.name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                                <span className="text-sm text-muted-foreground">Email</span>
                                <span className="font-medium">{user?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                                <span className="text-sm text-muted-foreground">Rol</span>
                                <span className="font-medium">{user?.role || 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" />
                            Cambiar Contraseña
                        </CardTitle>
                        <CardDescription>Actualice su contraseña de acceso</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            
                            <Button type="submit" className="w-full" disabled={isChangingPassword}>
                                {isChangingPassword ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Actualizando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Cambiar Contraseña
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Security Info Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Seguridad de la Cuenta
                        </CardTitle>
                        <CardDescription>Recomendaciones de seguridad</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="p-4 rounded-lg bg-secondary/50">
                                <h4 className="font-medium mb-2">Contraseña Segura</h4>
                                <p className="text-sm text-muted-foreground">
                                    Use al menos 8 caracteres con letras mayúsculas, minúsculas, números y símbolos.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-secondary/50">
                                <h4 className="font-medium mb-2">Cambio Regular</h4>
                                <p className="text-sm text-muted-foreground">
                                    Cambie su contraseña periódicamente, al menos cada 90 días.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-secondary/50">
                                <h4 className="font-medium mb-2">No Compartir</h4>
                                <p className="text-sm text-muted-foreground">
                                    Nunca comparta sus credenciales de acceso con otras personas.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Configuracion;
