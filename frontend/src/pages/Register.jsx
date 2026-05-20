import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { 
    Eye, EyeOff, Mail, Lock, User, Building2, Phone, MapPin, 
    FileCheck, ArrowRight, ArrowLeft, Check, Loader2, Hash, Search
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
    const { register, isAuthenticated, consultRNC } = useAuth();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLookingUpRnc, setIsLookingUpRnc] = useState(false);
    const [rncLookupMessage, setRncLookupMessage] = useState('');
    const [rncLookupSuccess, setRncLookupSuccess] = useState(false);

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
        const digits = value.replace(/\D/g, '').slice(0, 11);
        // RNC (9 digits): XXX-XXXXX-X
        // Cédula (11 digits): XXX-XXXXXXX-X
        if (digits.length <= 3) return digits;
        if (digits.length <= 9) {
            // While ≤ 9 digits we keep the RNC-style mask
            if (digits.length <= 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
            return `${digits.slice(0, 3)}-${digits.slice(3, 8)}-${digits.slice(8, 9)}`;
        }
        // 10–11 digits → switch to Cédula mask XXX-XXXXXXX-X
        if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 10)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10, 11)}`;
    };

    const handleCompanyChange = (field, value) => {
        if (field === 'rnc') {
            value = formatRNC(value);
            // Reset RNC lookup state when RNC changes
            setRncLookupMessage('');
            setRncLookupSuccess(false);
        }
        setCompanyData(prev => ({ ...prev, [field]: value }));
    };

    const handleUserChange = (field, value) => {
        setUserData(prev => ({ ...prev, [field]: value }));
    };

    const lookupRnc = async () => {
        const cleanRnc = (companyData.rnc || '').replace(/\D/g, '');
        if (cleanRnc.length !== 9 && cleanRnc.length !== 11) {
            setRncLookupMessage('Ingresa un RNC (9 dígitos) o Cédula (11 dígitos) válido');
            setRncLookupSuccess(false);
            return;
        }
        setIsLookingUpRnc(true);
        setRncLookupMessage('');
        setRncLookupSuccess(false);
        try {
            const result = await consultRNC(cleanRnc);
            if (result.success && result.data) {
                const apiName = result.data.name || result.data.razonSocial || result.data.nombre;
                const status = result.data.status || result.data.estado;
                if (apiName && status !== 'DESCONOCIDO' && status !== 'ERROR' && apiName !== 'No encontrado' && apiName !== 'Error' && apiName !== 'Error al consultar') {
                    setCompanyData(prev => ({ ...prev, companyName: apiName }));
                    setRncLookupMessage(`RNC válido. Empresa: ${apiName}`);
                    setRncLookupSuccess(true);
                } else {
                    setRncLookupMessage('RNC no encontrado en la DGII. Puedes ingresar el nombre manualmente.');
                    setRncLookupSuccess(false);
                }
            } else {
                setRncLookupMessage(result.error || 'No se pudo consultar el RNC.');
                setRncLookupSuccess(false);
            }
        } catch (err) {
            setRncLookupMessage('Error al consultar el RNC.');
            setRncLookupSuccess(false);
        } finally {
            setIsLookingUpRnc(false);
        }
    };

    const handleRncKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            lookupRnc();
        }
    };

    const validateStep1 = () => {
        if (!companyData.rnc || !companyData.companyName || !companyData.companyEmail) {
            setError('Por favor complete todos los campos requeridos');
            return false;
        }
        // Allow both RNC (9 digits → XXX-XXXXX-X) and Cédula (11 digits → XXX-XXXXXXX-X)
        const rncRegex = /^\d{3}-\d{5}-\d{1}$/;
        const cedulaRegex = /^\d{3}-\d{7}-\d{1}$/;
        if (!rncRegex.test(companyData.rnc) && !cedulaRegex.test(companyData.rnc)) {
            setError('Debe tener el formato XXX-XXXXX-X (RNC) o XXX-XXXXXXX-X (Cédula)');
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
        const result = await register(companyData, userData, acceptTerms);
        
        if (result.success) {
            // Registration successful - redirect to login
            navigate('/login', { 
                state: { 
                    message: result.message || 'Registro exitoso. Por favor inicia sesión.',
                    email: userData.email 
                } 
            });
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
                                <span>Auto-completado por RNC desde la DGII</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-accent" />
                                </div>
                                <span>Cumplimiento automático DGII</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-sm text-primary-foreground/60">
                        © {new Date().getFullYear()} Verifact. Todos los derechos reservados.
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
                                {currentStep === 1 && 'Empieza con tu RNC y completaremos los datos por ti'}
                                {currentStep === 2 && 'Configura tu cuenta de administrador'}
                                {currentStep === 3 && 'Revisa los datos antes de continuar'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm" data-testid="register-error">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Company Data */}
                            {currentStep === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    {/* RNC first */}
                                    <div className="space-y-2">
                                        <Label htmlFor="rnc">RNC o Cédula *</Label>
                                        <div className="relative flex gap-2">
                                            <div className="relative flex-1">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    id="rnc"
                                                    placeholder="XXX-XXXXX-X o XXX-XXXXXXX-X"
                                                    value={companyData.rnc}
                                                    onChange={(e) => handleCompanyChange('rnc', e.target.value)}
                                                    onBlur={lookupRnc}
                                                    onKeyDown={handleRncKeyDown}
                                                    className="pl-10"
                                                    maxLength={13}
                                                    data-testid="register-rnc-input"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={lookupRnc}
                                                disabled={isLookingUpRnc}
                                                data-testid="register-rnc-lookup-button"
                                            >
                                                {isLookingUpRnc ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Search className="h-4 w-4" />
                                                )}
                                                <span className="ml-2 hidden sm:inline">Consultar</span>
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Formato: XXX-XXXXX-X (RNC, 9 dígitos) o XXX-XXXXXXX-X (Cédula, 11 dígitos). Pulsa Enter o sal del campo para auto-completar el nombre.
                                        </p>
                                        {rncLookupMessage && (
                                            <p
                                                className={cn(
                                                    "text-xs flex items-center gap-1",
                                                    rncLookupSuccess ? "text-success" : "text-destructive"
                                                )}
                                                data-testid="register-rnc-lookup-message"
                                            >
                                                {rncLookupSuccess && <Check className="h-3 w-3" />}
                                                {rncLookupMessage}
                                            </p>
                                        )}
                                    </div>

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
                                                data-testid="register-company-name-input"
                                            />
                                        </div>
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
                                                data-testid="register-company-email-input"
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
                                                data-testid="register-phone-input"
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
                                                data-testid="register-address-input"
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
                                                data-testid="register-user-name-input"
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
                                                data-testid="register-user-email-input"
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
                                                data-testid="register-password-input"
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
                                                data-testid="register-confirm-password-input"
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
                                                <span className="text-muted-foreground">RNC:</span>
                                                <span className="font-medium">{companyData.rnc}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Nombre:</span>
                                                <span className="font-medium">{companyData.companyName}</span>
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
                                            data-testid="register-terms-checkbox"
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
                                        data-testid="register-back-button"
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
                                        data-testid="register-next-button"
                                    >
                                        Continuar
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button 
                                        type="submit"
                                        className="flex-1 bg-primary hover:bg-primary-hover"
                                        disabled={isSubmitting || !acceptTerms}
                                        data-testid="register-submit-button"
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
