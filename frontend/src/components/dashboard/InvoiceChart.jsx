import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const monthlyData = [
    { month: 'Ene', emitidas: 45, pagadas: 38, pendientes: 7 },
    { month: 'Feb', emitidas: 52, pagadas: 45, pendientes: 7 },
    { month: 'Mar', emitidas: 48, pagadas: 42, pendientes: 6 },
    { month: 'Abr', emitidas: 61, pagadas: 55, pendientes: 6 },
    { month: 'May', emitidas: 55, pagadas: 48, pendientes: 7 },
    { month: 'Jun', emitidas: 67, pagadas: 60, pendientes: 7 },
    { month: 'Jul', emitidas: 72, pagadas: 65, pendientes: 7 },
    { month: 'Ago', emitidas: 69, pagadas: 62, pendientes: 7 },
    { month: 'Sep', emitidas: 78, pagadas: 71, pendientes: 7 },
    { month: 'Oct', emitidas: 85, pagadas: 78, pendientes: 7 },
    { month: 'Nov', emitidas: 82, pagadas: 75, pendientes: 7 },
    { month: 'Dic', emitidas: 91, pagadas: 84, pendientes: 7 },
];

const revenueData = [
    { month: 'Ene', ingresos: 1250000 },
    { month: 'Feb', ingresos: 1420000 },
    { month: 'Mar', ingresos: 1380000 },
    { month: 'Abr', ingresos: 1650000 },
    { month: 'May', ingresos: 1520000 },
    { month: 'Jun', ingresos: 1780000 },
    { month: 'Jul', ingresos: 1920000 },
    { month: 'Ago', ingresos: 1850000 },
    { month: 'Sep', ingresos: 2100000 },
    { month: 'Oct', ingresos: 2280000 },
    { month: 'Nov', ingresos: 2150000 },
    { month: 'Dic', ingresos: 2450000 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border rounded-lg shadow-lg p-3">
                <p className="font-medium text-foreground mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
                        <span className="font-medium text-foreground">
                            {entry.dataKey === 'ingresos' 
                                ? `RD$ ${entry.value.toLocaleString()}`
                                : entry.value
                            }
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const InvoiceChart = () => {
    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Análisis de Facturación</h3>
                <p className="text-sm text-muted-foreground">Resumen anual de actividad</p>
            </div>
            
            <Tabs defaultValue="facturas" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="facturas">Facturas</TabsTrigger>
                    <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="facturas" className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis 
                                dataKey="month" 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                            />
                            <YAxis 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value) => (
                                    <span className="text-sm text-muted-foreground capitalize">{value}</span>
                                )}
                            />
                            <Bar 
                                dataKey="emitidas" 
                                fill="hsl(var(--primary))" 
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                                dataKey="pagadas" 
                                fill="hsl(var(--accent))" 
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                                dataKey="pendientes" 
                                fill="hsl(var(--warning))" 
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="ingresos" className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis 
                                dataKey="month" 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                            />
                            <YAxis 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="ingresos" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorIngresos)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default InvoiceChart;
