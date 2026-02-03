import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { 
    Eye, EyeOff, Mail, Lock, User, Building2, Phone, MapPin, 
    FileCheck, ArrowRight, ArrowLeft, Check, Loader2, Hash
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const steps = [
    { id: 1, name: 'Datos de Empresa', description: 'Información fiscal' },
    { id: 2, name: 'Datos de Usuario', description: 'Cuenta administrador' },
    { id: 3, name: 'Confirmación', description: 'Revisar y crear' },
];

const Register = () => {
    const navigate = useNavigate();
    const { register, isAuthenticated } = useAuth();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Company Data
    const [companyData, setCompanyData] = useState({
        companyName: '',
        rnc: '',
        companyEmail: '',
        phone: '',
        address: ''
    });

    // User Data
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const formatRNC = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        // Format as XXX-XXXXX-X
        if (digits.length <= 3) return digits;
        if (digits.length <= 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 8)}-${digits.slice(8, 9)}`;
    };

    const handleCompanyChange = (field, value) => {
        if (field === 'rnc') {
            value = formatRNC(value);
        }
        setCompanyData(prev => ({ ...prev, [field]: value }));
    };

    const handleUserChange = (field, value) => {
        setUserData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep1 = () => {
        if (!companyData.companyName || !companyData.rnc || !companyData.companyEmail) {
            setError('Por favor complete todos los campos requeridos');
            return false;
        }
        // Validate RNC format (XXX-XXXXX-X)
        const rncRegex = /^\d{3}-\d{5}-\d{1}$/;
        if (!rncRegex.test(companyData.rnc)) {
            setError('El RNC debe tener el formato XXX-XXXXX-X');
            return false;
        }
        setError('');
        return true;
    };

    const validateStep2 = () => {
        if (!userData.name || !userData.email || !userData.password || !userData.confirmPassword) {
            setError('Por favor complete todos los campos');
            return false;
        }
        if (userData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return false;
        }
        if (userData.password !== userData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }
        setError('');
        return true;
    };

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        setError('');
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!acceptTerms) {
            setError('Debes aceptar los términos y condiciones');
            return;
        }

        setIsSubmitting(true);
        const result = await register(companyData, userData);
        
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Error en el registro');
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
                        backgroundImage: 'url(https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBvZmZpY2V8ZW58MHx8fHwxNzcwMTM4OTk4fDA&ixlib=rb-4.1.0&q=85)'
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
                            Únete a miles de empresas dominicanas
                        </h2>
                        <p className="text-lg text-primary-foreground/80 mb-8">
                            Registra tu empresa y comienza a emitir facturas electrónicas 
                            cumpliendo con todas las normativas de la DGII.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-accent" />
                                </div>
                                <span>Registro rápido en minutos</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-accent" />
                                </div>
                                <span>Cumplimiento automático DGII</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-accent" />
                                </div>
                                <span>Soporte técnico especializado</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-sm text-primary-foreground/60">
                        © 2024 Verifact. Todos los derechos reservados.
                    </p>
                </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="flex-1 flex flex-col bg-background overflow-y-auto">
                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center justify-center gap-3 p-6 border-b">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <FileCheck className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">Verifact</h1>
                </div>

                <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                    <div className="w-full max-w-lg">
                        {/* Steps Indicator */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                {steps.map((step, index) => (
                                    <React.Fragment key={step.id}>
                                        <div className="flex flex-col items-center">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors",
                                                currentStep > step.id && "bg-accent text-accent-foreground",
                                                currentStep === step.id && "bg-primary text-primary-foreground",
                                                currentStep < step.id && "bg-secondary text-muted-foreground"
                                            )}>
                                                {currentStep > step.id ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    step.id
                                                )}
                                            </div>
                                            <div className="mt-2 text-center hidden sm:block">
                                                <p className={cn(
                                                    "text-sm font-medium",
                                                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {step.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{step.description}</p>
                                            </div>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={cn(
                                                "flex-1 h-0.5 mx-2 sm:mx-4 transition-colors",
                                                currentStep > step.id ? "bg-accent" : "bg-secondary"
                                            )} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-foreground">
                                {currentStep === 1 && 'Datos de tu Empresa'}
                                {currentStep === 2 && 'Crea tu cuenta'}
                                {currentStep === 3 && 'Confirma tu registro'}
                            </h2>
                            <p className="text-muted-foreground mt-2">
                                {currentStep === 1 && 'Ingresa la información fiscal de tu empresa'}
                                {currentStep === 2 && 'Configura tu cuenta de administrador'}
                                {currentStep === 3 && 'Revisa los datos antes de continuar'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Company Data */}
                            {currentStep === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="companyName"
                                                placeholder="Mi Empresa S.R.L."
                                                value={companyData.companyName}
                                                onChange={(e) => handleCompanyChange('companyName', e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="rnc">RNC (Registro Nacional del Contribuyente) *</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="rnc"
                                                placeholder="XXX-XXXXX-X"
                                                value={companyData.rnc}
                                                onChange={(e) => handleCompanyChange('rnc', e.target.value)}
                                                className="pl-10"
                                                maxLength={11}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Formato: XXX-XXXXX-X (ej: 101-25896-3)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="companyEmail">Correo de la Empresa *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="companyEmail"
                                                type="email"
                                                placeholder="contacto@miempresa.com.do"
                                                value={companyData.companyEmail}
                                                onChange={(e) => handleCompanyChange('companyEmail', e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                placeholder="809-555-1234"
                                                value={companyData.phone}
                                                onChange={(e) => handleCompanyChange('phone', e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Dirección Fiscal</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="address"
                                                placeholder="Av. Winston Churchill #123, Santo Domingo"
                                                value={companyData.address}
                                                onChange={(e) => handleCompanyChange('address', e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: User Data */}
                            {currentStep === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre Completo *</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                placeholder="Juan Pérez"
                                                value={userData.name}
                                                onChange={(e) => handleUserChange('name', e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="userEmail">Correo Electrónico *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="userEmail"
                                                type="email"
                                                placeholder="tu@email.com"
                                                value={userData.email}
                                                onChange={(e) => handleUserChange('email', e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Contraseña *</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={userData.password}
                                                onChange={(e) => handleUserChange('password', e.target.value)}
                                                className="pl-10 pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Mínimo 8 caracteres
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={userData.confirmPassword}
                                                onChange={(e) => handleUserChange('confirmPassword', e.target.value)}
                                                className="pl-10 pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Confirmation */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="rounded-xl border bg-secondary/30 p-6">
                                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            Datos de la Empresa
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Nombre:</span>
                                                <span className="font-medium">{companyData.companyName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">RNC:</span>
                                                <span className="font-medium">{companyData.rnc}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Correo:</span>
                                                <span className="font-medium">{companyData.companyEmail}</span>
                                            </div>
                                            {companyData.phone && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Teléfono:</span>
                                                    <span className="font-medium">{companyData.phone}</span>
                                                </div>
                                            )}
                                            {companyData.address && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Dirección:</span>
                                                    <span className="font-medium text-right max-w-[200px]">{companyData.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border bg-secondary/30 p-6">
                                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                            <User className="h-5 w-5 text-primary" />
                                            Datos del Administrador
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Nombre:</span>
                                                <span className="font-medium">{userData.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Correo:</span>
                                                <span className="font-medium">{userData.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-2">
                                        <Checkbox 
                                            id="terms" 
                                            checked={acceptTerms}
                                            onCheckedChange={setAcceptTerms}
                                        />
                                        <Label 
                                            htmlFor="terms" 
                                            className="text-sm font-normal text-muted-foreground cursor-pointer leading-relaxed"
                                        >
                                            Acepto los{' '}
                                            <Link to="/terms" className="text-primary hover:underline">
                                                Términos de servicio
                                            </Link>{' '}
                                            y la{' '}
                                            <Link to="/privacy" className="text-primary hover:underline">
                                                Política de privacidad
                                            </Link>{' '}
                                            de Verifact
                                        </Label>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex items-center gap-4 mt-8">
                                {currentStep > 1 && (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={handleBack}
                                        className="flex-1"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Atrás
                                    </Button>
                                )}
                                
                                {currentStep < 3 ? (
                                    <Button 
                                        type="button" 
                                        onClick={handleNext}
                                        className="flex-1 bg-primary hover:bg-primary-hover"
                                    >
                                        Continuar
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button 
                                        type="submit"
                                        className="flex-1 bg-primary hover:bg-primary-hover"
                                        disabled={isSubmitting || !acceptTerms}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Registrando...
                                            </>
                                        ) : (
                                            <>
                                                Crear Cuenta
                                                <Check className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </form>

                        <p className="text-center text-sm text-muted-foreground mt-6">
                            ¿Ya tienes cuenta?{' '}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
