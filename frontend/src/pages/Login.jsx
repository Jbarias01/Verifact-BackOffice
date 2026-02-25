import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, FileCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check for success message from registration
    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            if (location.state.email) {
                setEmail(location.state.email);
            }
            // Clear the state to prevent showing message on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        if (!email || !password) {
            setError('Por favor complete todos los campos');
            setIsSubmitting(false);
            return;
        }

        const result = await login(email, password);
        
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Error al iniciar sesión');
        }
        
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image/Branding */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBmaW5hbmNlfGVufDB8fHx8MTc3MDEzODk5MHww&ixlib=rb-4.1.0&q=85)'
                    }}
                />
                <div className="absolute inset-0 auth-background" />
                <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                            <FileCheck className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Verifact</h1>
                            <p className="text-sm text-primary-foreground/80">Facturación Electrónica Segura</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-w-lg">
                        <h2 className="text-4xl font-bold leading-tight mb-4">
                            Gestiona tu facturación electrónica de forma segura
                        </h2>
                        <p className="text-lg text-primary-foreground/80 mb-8">
                            Cumple con las normativas de la DGII de República Dominicana. 
                            Emite facturas electrónicas válidas en segundos.
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold">100%</p>
                                <p className="text-sm text-primary-foreground/80">Cumplimiento DGII</p>
                            </div>
                            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold">24/7</p>
                                <p className="text-sm text-primary-foreground/80">Disponibilidad</p>
                            </div>
                            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-4 text-center">
                                <p className="text-3xl font-bold">+5K</p>
                                <p className="text-sm text-primary-foreground/80">Empresas</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-sm text-primary-foreground/60">
                        © {new Date().getFullYear()} Verifact. Todos los derechos reservados.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <FileCheck className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Verifact</h1>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-foreground">Bienvenido de nuevo</h2>
                        <p className="text-muted-foreground mt-2">
                            Ingresa tus credenciales para acceder
                        </p>
                    </div>

                    {successMessage && (
                        <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="correo@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Contraseña</Label>
                                <Link 
                                    to="/forgot-password" 
                                    className="text-sm text-primary hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="remember" 
                                checked={rememberMe}
                                onCheckedChange={setRememberMe}
                            />
                            <Label 
                                htmlFor="remember" 
                                className="text-sm font-normal text-muted-foreground cursor-pointer"
                            >
                                Recordar mi sesión
                            </Label>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary-hover"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    Iniciar Sesión
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    ¿Nuevo en Verifact?
                                </span>
                            </div>
                        </div>

                        <Button 
                            variant="outline" 
                            className="w-full mt-4"
                            asChild
                        >
                            <Link to="/register">
                                Registrar mi empresa
                            </Link>
                        </Button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground mt-8">
                        Al iniciar sesión, aceptas nuestros{' '}
                        <Link to="/terms" className="text-primary hover:underline">
                            Términos de servicio
                        </Link>{' '}
                        y{' '}
                        <Link to="/privacy" className="text-primary hover:underline">
                            Política de privacidad
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
