import React from 'react';
import { Plus, FileText, Users, Receipt, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const actions = [
    {
        name: 'Nueva Factura',
        description: 'Crear factura electrónica',
        icon: Plus,
        variant: 'primary',
        className: 'bg-primary hover:bg-primary-hover text-primary-foreground'
    },
    {
        name: 'Nuevo Cliente',
        description: 'Registrar cliente',
        icon: Users,
        variant: 'outline'
    },
    {
        name: 'Comprobante',
        description: 'Emitir comprobante fiscal',
        icon: Receipt,
        variant: 'outline'
    },
    {
        name: 'Importar',
        description: 'Cargar datos',
        icon: Upload,
        variant: 'outline'
    },
    {
        name: 'Exportar',
        description: 'Descargar reportes',
        icon: Download,
        variant: 'outline'
    },
];

export const QuickActions = () => {
    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Acciones Rápidas</h3>
                <p className="text-sm text-muted-foreground">Operaciones frecuentes</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <Button
                            key={index}
                            variant={action.variant === 'primary' ? 'default' : 'outline'}
                            className={cn(
                                "flex flex-col items-center justify-center h-auto py-4 gap-2",
                                action.variant === 'primary' && action.className
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <div className="text-center">
                                <p className="text-sm font-medium">{action.name}</p>
                                <p className={cn(
                                    "text-[10px] mt-0.5",
                                    action.variant === 'primary' 
                                        ? 'text-primary-foreground/80' 
                                        : 'text-muted-foreground'
                                )}>
                                    {action.description}
                                </p>
                            </div>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;
