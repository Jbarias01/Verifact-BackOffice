import React from 'react';
import { FileText, FileCheck, FileClock, AlertCircle, Plus, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { InvoiceChart } from '@/components/dashboard/InvoiceChart';
import { QuickActions } from '@/components/dashboard/QuickActions';

const Dashboard = () => {
    const { user, company } = useAuth();

    const currentDate = new Date().toLocaleDateString('es-DO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                        ¡Bienvenido, {user?.name?.split(' ')[0] || 'Usuario'}!
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {currentDate.charAt(0).toUpperCase() + currentDate.slice(1)}
                    </p>
                </div>
                <Button className="bg-primary hover:bg-primary-hover">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Factura
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Facturas"
                    value="847"
                    subtitle="Este mes"
                    icon={FileText}
                    trend="up"
                    trendValue="+12.5%"
                    variant="default"
                />
                <StatCard
                    title="Facturas Emitidas"
                    value="623"
                    subtitle="Enviadas exitosamente"
                    icon={FileCheck}
                    trend="up"
                    trendValue="+8.2%"
                    variant="success"
                />
                <StatCard
                    title="Pendientes de Pago"
                    value="156"
                    subtitle="Por cobrar"
                    icon={FileClock}
                    trend="down"
                    trendValue="-3.1%"
                    variant="warning"
                />
                <StatCard
                    title="Vencidas"
                    value="68"
                    subtitle="Requieren atención"
                    icon={AlertCircle}
                    variant="default"
                />
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* Charts and Recent Invoices */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <InvoiceChart />
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="rounded-xl border bg-card p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Resumen del Mes</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total Facturado</span>
                                <span className="text-xl font-bold text-foreground">RD$ 2,450,780.00</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full w-[73%] bg-gradient-to-r from-primary to-accent rounded-full" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">73% del objetivo mensual</span>
                                <span className="text-accent font-medium">Meta: RD$ 3,350,000.00</span>
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                            <div className="text-center p-3 rounded-lg bg-success-light">
                                <p className="text-2xl font-bold text-success">RD$ 1,890,450</p>
                                <p className="text-sm text-success/80">Cobrado</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-warning-light">
                                <p className="text-2xl font-bold text-warning">RD$ 560,330</p>
                                <p className="text-sm text-warning/80">Por cobrar</p>
                            </div>
                        </div>
                    </div>

                    {/* Top Clients */}
                    <div className="rounded-xl border bg-card p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Principales Clientes</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Comercial ABC S.R.L.', amount: 'RD$ 345,200', invoices: 12 },
                                { name: 'Distribuidora XYZ', amount: 'RD$ 289,450', invoices: 8 },
                                { name: 'Importadora del Caribe', amount: 'RD$ 234,100', invoices: 6 },
                                { name: 'Servicios Técnicos RD', amount: 'RD$ 178,900', invoices: 15 },
                            ].map((client, index) => (
                                <div 
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                            {client.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{client.name}</p>
                                            <p className="text-xs text-muted-foreground">{client.invoices} facturas</p>
                                        </div>
                                    </div>
                                    <span className="font-semibold text-foreground">{client.amount}</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-4 text-primary">
                            Ver todos los clientes
                        </Button>
                    </div>
                </div>
            </div>

            {/* Recent Invoices Table */}
            <RecentInvoices />
        </div>
    );
};

export default Dashboard;
