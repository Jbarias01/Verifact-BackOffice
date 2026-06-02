import React, { useEffect, useState, useCallback } from 'react';
import { Globe, X, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ENV_DOT_CLASS = {
    prod: 'bg-success',
    cert: 'bg-warning',
    test: 'bg-muted-foreground',
};

/**
 * Modal that allows changing the active Verifact environment.
 * Opens when the user presses F8.
 */
export const EnvSwitcherModal = () => {
    const { environment, environments, setEnvironment } = useAuth();
    const [open, setOpen] = useState(false);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'F8') {
                e.preventDefault();
                setOpen(prev => !prev);
            } else if (e.key === 'Escape' && open) {
                e.preventDefault();
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open]);

    if (!open) return null;

    const handlePick = (value) => {
        setEnvironment(value);
        setOpen(false);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in"
            data-testid="env-switcher-modal"
            role="dialog"
            aria-modal="true"
            onClick={close}
        >
            <div
                className="relative w-full max-w-md rounded-2xl border bg-card shadow-2xl p-6 mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={close}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                    aria-label="Cerrar"
                    data-testid="env-switcher-close"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Cambiar ambiente</h3>
                        <p className="text-xs text-muted-foreground">
                            Atajo: <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">F8</kbd>
                        </p>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    {environments.map(env => {
                        const isActive = env.value === environment;
                        return (
                            <button
                                key={env.value}
                                type="button"
                                onClick={() => handlePick(env.value)}
                                data-testid={`env-switcher-option-${env.value}`}
                                className={cn(
                                    "w-full text-left rounded-lg border px-4 py-3 flex items-center justify-between transition",
                                    isActive
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:bg-secondary/60"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn("w-2.5 h-2.5 rounded-full", ENV_DOT_CLASS[env.value])} />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{env.label}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{env.url}</p>
                                    </div>
                                </div>
                                {isActive && <Check className="h-4 w-4 text-primary" />}
                            </button>
                        );
                    })}
                </div>

                <p className="text-[11px] text-muted-foreground mt-4">
                    El ambiente seleccionado se aplicará a TODAS las peticiones siguientes.
                </p>
            </div>
        </div>
    );
};

export default EnvSwitcherModal;
