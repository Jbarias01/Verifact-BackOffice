import React from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, ShoppingCart, Receipt, Package,
    AlertTriangle, Award, Boxes, FileCheck2, FileWarning,
    PlusCircle, BookOpenCheck, ChevronRight, Clock, ArrowUpRight,
    Users, Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';

// =========== DUMMY DATA (Mockup only) ===========
const cajero = { nombre: 'Dahyana Batista', sucursal: 'SUCURSAL PRINCIPAL' };
const ventasHoy = 84250;
const ventasAyer = 71800;
const tickets = 47;
const ticketsAyer = 41;
const ticketPromedio = ventasHoy / tickets;

const hourlySales = [
    { hora: '8:00', ventas: 2400 },
    { hora: '9:00', ventas: 5800 },
    { hora: '10:00', ventas: 7200 },
    { hora: '11:00', ventas: 9450 },
    { hora: '12:00', ventas: 12300 },
    { hora: '13:00', ventas: 14800 },
    { hora: '14:00', ventas: 9700 },
    { hora: '15:00', ventas: 8200 },
    { hora: '16:00', ventas: 7900 },
    { hora: '17:00', ventas: 6500 },
];

const topProductos = [
    { nombre: 'Coca-Cola 600ml', vendidos: 142, total: 7100, color: 'bg-rose-500' },
    { nombre: 'Pan de Agua', vendidos: 98, total: 1960, color: 'bg-amber-500' },
    { nombre: 'Doritos Nacho', vendidos: 76, total: 3800, color: 'bg-orange-500' },
    { nombre: 'Café Santo Domingo', vendidos: 54, total: 12420, color: 'bg-yellow-700' },
    { nombre: 'Cloro Mistolín 1L', vendidos: 38, total: 2660, color: 'bg-sky-500' },
];

const topCajeros = [
    { nombre: 'Dahyana B.', tickets: 18, ventas: 32400, iniciales: 'DB' },
    { nombre: 'Carlos M.', tickets: 14, ventas: 27100, iniciales: 'CM' },
    { nombre: 'Ayendi M.', tickets: 11, ventas: 18200, iniciales: 'AM' },
    { nombre: 'José L.', tickets: 4, ventas: 6550, iniciales: 'JL' },
];

const inventarioBajo = [
    { nombre: 'Aceite Cocinero 1L', stock: 3, minimo: 12 },
    { nombre: 'Arroz Mami 5lb', stock: 5, minimo: 20 },
    { nombre: 'Azúcar Cristal 5lb', stock: 7, minimo: 15 },
];

// =========== HELPERS ===========
const fmtRD = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n);
const pct = (cur, prev) => (((cur - prev) / prev) * 100);

// =========== COMPONENTS ===========
const KpiCard = ({ icon: Icon, label, value, delta, deltaLabel, accent = 'primary', testId }) => {
    const isUp = delta >= 0;
    return (
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-2" data-testid={testId}>
            <div className="flex items-center justify-between">
                <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    accent === 'primary' && 'bg-primary/10 text-primary',
                    accent === 'success' && 'bg-success/10 text-success',
                    accent === 'warning' && 'bg-warning/10 text-warning',
                    accent === 'accent' && 'bg-accent/15 text-accent',
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                {delta !== undefined && (
                    <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                        isUp ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}>
                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(delta).toFixed(1)}%
                    </span>
                )}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {deltaLabel && <p className="text-xs text-muted-foreground">{deltaLabel}</p>}
        </div>
    );
};

const QuickAction = ({ icon: Icon, title, description, to, hero, testId }) => (
    <Link
        to={to}
        data-testid={testId}
        className={cn(
            "group rounded-xl border p-5 flex items-start gap-4 transition-all hover:shadow-sm",
            hero
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary-hover"
                : "bg-card hover:border-primary/30"
        )}
    >
        <div className={cn(
            "w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0",
            hero ? "bg-white/15 text-primary-foreground" : "bg-primary/10 text-primary"
        )}>
            <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
            <p className={cn("font-semibold", hero ? "text-primary-foreground" : "text-foreground")}>{title}</p>
            <p className={cn("text-xs mt-0.5", hero ? "text-primary-foreground/80" : "text-muted-foreground")}>{description}</p>
        </div>
        <ArrowUpRight className={cn(
            "h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            hero ? "text-primary-foreground" : "text-muted-foreground"
        )} />
    </Link>
);

// =========== MAIN VIEW ===========
const DashboardPosMockup = () => {
    const deltaVentas = pct(ventasHoy, ventasAyer);
    const deltaTickets = pct(tickets, ticketsAyer);

    return (
        <div className="min-h-screen bg-background">
            {/* Mockup banner */}
            <div className="bg-warning text-warning-foreground text-xs font-semibold tracking-widest uppercase text-center py-1.5" data-testid="mockup-banner">
                MOCKUP / Vista previa de diseño · No funcional
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
                {/* Header */}
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                            <Store className="h-4 w-4" />
                            {cajero.sucursal}
                            <span className="mx-1.5 text-muted-foreground/40">·</span>
                            <Clock className="h-3.5 w-3.5" />
                            Caja abierta desde 8:00 am
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-1">
                            ¡Bienvenid@, <span className="text-primary">{cajero.nombre.split(' ')[0]}</span>!
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Este es el resumen operativo de tu sucursal hoy.
                        </p>
                    </div>
                    <Button asChild size="lg" className="bg-success hover:bg-success/90 text-white" data-testid="quick-new-sale-button">
                        <Link to="/mockup/pos">
                            <PlusCircle className="h-5 w-5 mr-2" />
                            Nueva Venta
                        </Link>
                    </Button>
                </header>

                {/* KPIs */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        icon={Receipt}
                        label="Ventas de hoy"
                        value={fmtRD(ventasHoy)}
                        delta={deltaVentas}
                        deltaLabel={`vs ${fmtRD(ventasAyer)} ayer`}
                        accent="primary"
                        testId="kpi-ventas-hoy"
                    />
                    <KpiCard
                        icon={ShoppingCart}
                        label="Tickets"
                        value={tickets}
                        delta={deltaTickets}
                        deltaLabel={`${ticketsAyer} tickets ayer`}
                        accent="accent"
                        testId="kpi-tickets"
                    />
                    <KpiCard
                        icon={Award}
                        label="Ticket promedio"
                        value={fmtRD(ticketPromedio)}
                        deltaLabel="Objetivo: RD$ 2,200"
                        accent="success"
                        testId="kpi-ticket-promedio"
                    />
                    <KpiCard
                        icon={FileCheck2}
                        label="e-CF emitidos hoy"
                        value="47"
                        deltaLabel="2 pendientes de firma DGII"
                        accent="warning"
                        testId="kpi-ecf-hoy"
                    />
                </section>

                {/* Chart + Top productos */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 rounded-xl border bg-card p-6" data-testid="ventas-hora-card">
                        <div className="flex items-baseline justify-between mb-4">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">Ventas por hora</h2>
                                <p className="text-xs text-muted-foreground">Últimas 10 horas operativas</p>
                            </div>
                            <Badge variant="outline" className="text-xs">Hoy</Badge>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={hourlySales} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(215 76% 42%)" stopOpacity={0.35} />
                                        <stop offset="100%" stopColor="hsl(215 76% 42%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hora" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                    formatter={(v) => [fmtRD(v), 'Ventas']}
                                />
                                <Area type="monotone" dataKey="ventas" stroke="hsl(215 76% 42%)" strokeWidth={2} fill="url(#ventasGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-xl border bg-card p-6" data-testid="top-productos-card">
                        <div className="flex items-baseline justify-between mb-4">
                            <h2 className="text-base font-semibold text-foreground">Top productos</h2>
                            <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-foreground">
                                Ver todos
                                <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                        <ul className="space-y-4">
                            {topProductos.map((p, idx) => (
                                <li key={p.nombre} className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0", p.color)}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{p.nombre}</p>
                                        <p className="text-xs text-muted-foreground">{p.vendidos} unidades · {fmtRD(p.total)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Cajeros + Inventario + e-CF Estado */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="rounded-xl border bg-card p-6" data-testid="top-cajeros-card">
                        <div className="flex items-baseline justify-between mb-4">
                            <h2 className="text-base font-semibold text-foreground inline-flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Top cajeros del día
                            </h2>
                        </div>
                        <ul className="space-y-3">
                            {topCajeros.map((c, idx) => (
                                <li key={c.nombre} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-muted-foreground w-4">#{idx + 1}</span>
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                                        {c.iniciales}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">{c.nombre}</p>
                                        <p className="text-xs text-muted-foreground">{c.tickets} tickets</p>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">{fmtRD(c.ventas)}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-xl border bg-card p-6" data-testid="inventario-bajo-card">
                        <div className="flex items-baseline justify-between mb-4">
                            <h2 className="text-base font-semibold text-foreground inline-flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-warning" />
                                Stock bajo
                            </h2>
                            <Badge className="bg-warning/15 text-warning border-warning/30">{inventarioBajo.length} alertas</Badge>
                        </div>
                        <ul className="space-y-3">
                            {inventarioBajo.map((it) => (
                                <li key={it.nombre} className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{it.nombre}</p>
                                        <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-warning rounded-full"
                                                style={{ width: `${Math.min(100, (it.stock / it.minimo) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs font-mono text-muted-foreground">{it.stock}/{it.minimo}</p>
                                </li>
                            ))}
                        </ul>
                        <Button variant="outline" size="sm" className="w-full mt-4 text-xs">Ver inventario completo</Button>
                    </div>

                    <div className="rounded-xl border bg-card p-6" data-testid="ecf-status-card">
                        <h2 className="text-base font-semibold text-foreground inline-flex items-center gap-2 mb-4">
                            <FileCheck2 className="h-4 w-4 text-success" />
                            Estado e-CF
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success" />
                                    <span className="text-sm text-foreground">Emitidos hoy</span>
                                </div>
                                <span className="font-semibold text-foreground">47</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-warning" />
                                    <span className="text-sm text-foreground">Pendientes firma</span>
                                </div>
                                <span className="font-semibold text-foreground">2</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="inline-flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-destructive" />
                                    <span className="text-sm text-foreground">Errores</span>
                                </div>
                                <span className="font-semibold text-foreground">0</span>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t">
                                <span className="text-sm text-muted-foreground">Mes actual</span>
                                <span className="font-semibold text-foreground">1,284</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick actions */}
                <section>
                    <h2 className="text-base font-semibold text-foreground mb-4">Acciones rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickAction
                            icon={ShoppingCart}
                            title="Iniciar venta"
                            description="Abrir el POS"
                            to="/mockup/pos"
                            hero
                            testId="action-pos"
                        />
                        <QuickAction
                            icon={BookOpenCheck}
                            title="Cierre de caja"
                            description="Cerrar turno y conciliar"
                            to="#"
                            testId="action-cierre"
                        />
                        <QuickAction
                            icon={Boxes}
                            title="Inventario"
                            description="Productos y stock"
                            to="#"
                            testId="action-inventario"
                        />
                        <QuickAction
                            icon={FileWarning}
                            title="Comprobantes pendientes"
                            description="2 e-CF requieren firma"
                            to="#"
                            testId="action-pendientes"
                        />
                    </div>
                </section>

                <footer className="text-center text-xs text-muted-foreground pt-8 pb-4">
                    Mockup · Diseño propuesto para Dashboard POS · No conectado a datos reales
                </footer>
            </div>
        </div>
    );
};

export default DashboardPosMockup;
