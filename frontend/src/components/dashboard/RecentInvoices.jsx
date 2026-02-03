import React from 'react';
import { FileText, MoreHorizontal, Eye, Download, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const mockInvoices = [
    {
        id: 'F-2024-0126',
        client: 'Comercial ABC S.R.L.',
        rnc: '101-25896-3',
        amount: 'RD$ 125,450.00',
        date: '15 Ene 2024',
        dueDate: '30 Ene 2024',
        status: 'emitida'
    },
    {
        id: 'F-2024-0125',
        client: 'Distribuidora XYZ',
        rnc: '131-58974-2',
        amount: 'RD$ 89,320.00',
        date: '14 Ene 2024',
        dueDate: '29 Ene 2024',
        status: 'pagada'
    },
    {
        id: 'F-2024-0124',
        client: 'Servicios Técnicos RD',
        rnc: '101-36985-1',
        amount: 'RD$ 45,780.00',
        date: '13 Ene 2024',
        dueDate: '28 Ene 2024',
        status: 'pendiente'
    },
    {
        id: 'F-2024-0123',
        client: 'Importadora del Caribe',
        rnc: '130-89562-4',
        amount: 'RD$ 234,100.00',
        date: '12 Ene 2024',
        dueDate: '27 Ene 2024',
        status: 'vencida'
    },
    {
        id: 'F-2024-0122',
        client: 'Supermercados Unidos',
        rnc: '101-74123-8',
        amount: 'RD$ 67,890.00',
        date: '11 Ene 2024',
        dueDate: '26 Ene 2024',
        status: 'pagada'
    },
];

const statusConfig = {
    emitida: { label: 'Emitida', className: 'bg-primary/10 text-primary border-primary/20' },
    pagada: { label: 'Pagada', className: 'bg-success/10 text-success border-success/20' },
    pendiente: { label: 'Pendiente', className: 'bg-warning/10 text-warning border-warning/20' },
    vencida: { label: 'Vencida', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export const RecentInvoices = () => {
    return (
        <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between p-6 border-b">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Facturas Recientes</h3>
                    <p className="text-sm text-muted-foreground">Últimas facturas emitidas</p>
                </div>
                <Button variant="outline" size="sm">
                    Ver todas
                </Button>
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[140px]">Número</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>RNC</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockInvoices.map((invoice) => (
                            <TableRow key={invoice.id} className="group">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{invoice.id}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{invoice.client}</TableCell>
                                <TableCell className="text-muted-foreground">{invoice.rnc}</TableCell>
                                <TableCell className="text-right font-semibold">{invoice.amount}</TableCell>
                                <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                                <TableCell className="text-muted-foreground">{invoice.dueDate}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant="outline" 
                                        className={cn(
                                            "font-medium",
                                            statusConfig[invoice.status].className
                                        )}
                                    >
                                        {statusConfig[invoice.status].label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Ver detalles
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Download className="h-4 w-4 mr-2" />
                                                Descargar PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Send className="h-4 w-4 mr-2" />
                                                Enviar por correo
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default RecentInvoices;
