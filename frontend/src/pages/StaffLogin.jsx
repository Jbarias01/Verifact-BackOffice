import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, AtSign, Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnvSwitcherModal } from '@/components/EnvSwitcherModal';

const StaffLogin = () => {
    const navigate = useNavigate();
    const { loginStaff, isAuthenticated, environment, environments } = useAuth();

    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const envLabel = environments.find(e => e.value === environment)?.label || environment;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!emailOrUsername || !password) {
            setError('Por favor complete todos los campos');
            setIsSubmitting(false);
            return;
        }

        const result = await loginStaff(emailOrUsername.trim(), password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Error al iniciar sesión');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            <EnvSwitcherModal />

            {/* Decorative grid */}
            <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />

            <div className="relative z-10 w-full max-w-md">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <ShieldCheck className="h-7 w-7 text-slate-900" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-bold tracking-tight text-white">Verifact · Staff</h1>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">BackOffice de administración</p>
                    </div>
                </div>

                <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800 shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold text-white">Acceso de Staff</h2>
                        <p className="text-sm text-slate-400 mt-1">Solo para administradores autorizados</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm" data-testid="staff-login-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="emailOrUsername" className="text-slate-300">Email o Usuario</Label>
                            <div className="relative">
                                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <Input
                                    id="emailOrUsername"
                                    placeholder="admin o admin@verifact.com.do"
                                    value={emailOrUsername}
                                    onChange={(e) => setEmailOrUsername(e.target.value)}
                                    className="pl-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-amber-400"
                                    data-testid="staff-login-identifier-input"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-amber-400"
                                    data-testid="staff-login-password-input"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                            disabled={isSubmitting}
                            data-testid="staff-login-submit-button"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    Acceder
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="text-sm text-slate-400 hover:text-amber-400 transition"
                        data-testid="staff-back-to-tenant-link"
                    >
                        ← Acceso de empresas (Tenants)
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;
