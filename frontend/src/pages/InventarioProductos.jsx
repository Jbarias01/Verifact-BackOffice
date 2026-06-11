import React, { useMemo, useState } from 'react';
import {
    Package, Plus, Search, Pencil, Trash2, Boxes, AlertTriangle,
    DollarSign, Loader2, CheckCircle2, XCircle, ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Categories available — must match the Categorías mockup (codigo + color)
const CATEGORIAS = [
    { codigo: 'BEB', nombre: 'Bebidas', color: 'bg-blue-500' },
    { codigo: 'SNA', nombre: 'Snacks', color: 'bg-orange-500' },
    { codigo: 'DES', nombre: 'Desayuno', color: 'bg-yellow-500' },
    { codigo: 'LIM', nombre: 'Limpieza', color: 'bg-cyan-500' },
    { codigo: 'LAC', nombre: 'Lácteos', color: 'bg-purple-500' },
    { codigo: 'PAN', nombre: 'Panadería', color: 'bg-rose-500' },
];

const UNIDADES = ['UND', 'CAJ', 'KG', 'LB', 'LT', 'ML', 'PAQ', 'DOC'];

// Initial mockup data
const INITIAL_PRODUCTOS = [
    { id: '01', sku: '7702011099054', nombre: 'Coca-Cola 600 ml', categoria: 'BEB', unidad: 'UND', costo: 42, precio: 65, stock: 142, minimo: 30, activo: true },
    { id: '02', sku: '7702011001234', nombre: 'Sprite 600 ml', categoria: 'BEB', unidad: 'UND', costo: 42, precio: 65, stock: 98, minimo: 30, activo: true },
    { id: '03', sku: '7702011004444', nombre: 'Pepsi Lata 355 ml', categoria: 'BEB', unidad: 'UND', costo: 35, precio: 55, stock: 76, minimo: 24, activo: true },
    { id: '04', sku: '7702011005555', nombre: 'Red Bull 250 ml', categoria: 'BEB', unidad: 'UND', costo: 120, precio: 175, stock: 24, minimo: 12, activo: true },
    { id: '05', sku: '7501031311111', nombre: 'Doritos Nacho 45g', categoria: 'SNA', unidad: 'UND', costo: 48, precio: 70, stock: 38, minimo: 20, activo: true },
    { id: '06', sku: '7501031322222', nombre: 'Lays Original 50g', categoria: 'SNA', unidad: 'UND', costo: 44, precio: 65, stock: 52, minimo: 20, activo: true },
    { id: '07', sku: '7501031333333', nombre: 'Cheetos Flamin Hot', categoria: 'SNA', unidad: 'UND', costo: 52, precio: 75, stock: 41, minimo: 20, activo: true },
    { id: '08', sku: '7501031344444', nombre: 'Pringles Original 124g', categoria: 'SNA', unidad: 'UND', costo: 135, precio: 195, stock: 8, minimo: 15, activo: true },
    { id: '09', sku: '7591234560001', nombre: 'Cloro Mistolín 1 L', categoria: 'LIM', unidad: 'LT', costo: 62, precio: 95, stock: 28, minimo: 15, activo: true },
    { id: '10', sku: '7591234560002', nombre: 'Detergente Ariel 250g', categoria: 'LIM', unidad: 'UND', costo: 98, precio: 145, stock: 32, minimo: 12, activo: true },
    { id: '11', sku: '7591234560003', nombre: 'Jabón Dove Barra', categoria: 'LIM', unidad: 'UND', costo: 55, precio: 85, stock: 56, minimo: 24, activo: true },
    { id: '12', sku: '7501030400001', nombre: 'Café Santo Domingo 1lb', categoria: 'DES', unidad: 'LB', costo: 195, precio: 285, stock: 5, minimo: 10, activo: true },
    { id: '13', sku: '7591400000123', nombre: 'Leche Rica Entera 1L', categoria: 'LAC', unidad: 'LT', costo: 78, precio: 110, stock: 44, minimo: 20, activo: true },
    { id: '14', sku: '7591400000456', nombre: 'Yogurt Yoplait Fresa 150g', categoria: 'LAC', unidad: 'UND', costo: 38, precio: 55, stock: 0, minimo: 15, activo: false },
    { id: '15', sku: '7591200001000', nombre: 'Pan de Agua', categoria: 'PAN', unidad: 'UND', costo: 12, precio: 20, stock: 88, minimo: 30, activo: true },
];

const fmtRD = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(n);
const newId = () => Math.random().toString(36).slice(2, 8);

const InventarioProductos = () => {
    const [productos, setProductos] = useState(INITIAL_PRODUCTOS);
    const [query, setQuery] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all'); // all | low | out
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        sku: '', nombre: '', categoria: 'BEB', unidad: 'UND',
        costo: '', precio: '', stock: '', minimo: '', activo: true,
    });

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return productos.filter(p => {
            if (catFilter !== 'all' && p.categoria !== catFilter) return false;
            if (stockFilter === 'low' && !(p.stock > 0 && p.stock <= p.minimo)) return false;
            if (stockFilter === 'out' && p.stock !== 0) return false;
            if (q && !p.nombre.toLowerCase().includes(q) && !p.sku.includes(q)) return false;
            return true;
        });
    }, [productos, query, catFilter, stockFilter]);

    const totalProductos = productos.length;
    const totalActivos = productos.filter(p => p.activo).length;
    const stockBajo = productos.filter(p => p.stock > 0 && p.stock <= p.minimo).length;
    const sinStock = productos.filter(p => p.stock === 0).length;
    const valorInventario = productos.reduce((s, p) => s + p.costo * p.stock, 0);

    const openCreate = () => {
        setEditing(null);
        setForm({ sku: '', nombre: '', categoria: 'BEB', unidad: 'UND', costo: '', precio: '', stock: '', minimo: '', activo: true });
        setDialogOpen(true);
    };
    const openEdit = (p) => {
        setEditing(p);
        setForm({
            sku: p.sku, nombre: p.nombre, categoria: p.categoria, unidad: p.unidad,
            costo: String(p.costo), precio: String(p.precio), stock: String(p.stock), minimo: String(p.minimo), activo: p.activo,
        });
        setDialogOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.sku.trim() || !form.nombre.trim() || !form.precio) {
            toast.error('SKU, Nombre y Precio son obligatorios');
            return;
        }
        const data = {
            sku: form.sku.trim(),
            nombre: form.nombre.trim(),
            categoria: form.categoria,
            unidad: form.unidad,
            costo: parseFloat(form.costo) || 0,
            precio: parseFloat(form.precio),
            stock: parseInt(form.stock) || 0,
            minimo: parseInt(form.minimo) || 0,
            activo: form.activo,
        };
        setSaving(true);
        await new Promise(r => setTimeout(r, 500));
        if (editing) {
            setProductos(prev => prev.map(p => p.id === editing.id ? { ...p, ...data } : p));
            toast.success('Producto actualizado');
        } else {
            setProductos(prev => [{ id: newId(), ...data }, ...prev]);
            toast.success('Producto creado');
        }
        setSaving(false);
        setDialogOpen(false);
    };

    const handleDelete = (p) => {
        if (!window.confirm(`¿Eliminar el producto "${p.nombre}"?`)) return;
        setProductos(prev => prev.filter(x => x.id !== p.id));
        toast.success('Producto eliminado');
    };

    const margen = (p) => {
        if (!p.costo || !p.precio) return 0;
        return ((p.precio - p.costo) / p.precio) * 100;
    };

    return (
        <div className="space-y-6">
            <div className="rounded-md bg-warning/15 border border-warning/30 text-warning text-xs font-semibold uppercase tracking-widest text-center py-1.5" data-testid="inv-prod-demo-banner">
                Datos de prueba · Conexión con API pendiente
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground inline-flex items-center gap-3">
                        <Package className="h-6 w-6 text-primary" />
                        Productos
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Administra el catálogo de productos disponibles para la venta.
                    </p>
                </div>
                <Button onClick={openCreate} data-testid="inv-prod-create-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo producto
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiTile icon={Boxes} label="Productos" value={totalProductos} caption={`${totalActivos} activos`} testId="kpi-total" />
                <KpiTile icon={AlertTriangle} label="Stock bajo" value={stockBajo} accent="warning" caption="≤ mínimo" testId="kpi-low" />
                <KpiTile icon={XCircle} label="Sin stock" value={sinStock} accent="destructive" caption="Reabastecer" testId="kpi-out" />
                <KpiTile icon={DollarSign} label="Valor de inventario" value={fmtRD(valorInventario)} accent="accent" caption="Al costo" testId="kpi-value" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por SKU o nombre…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                        data-testid="inv-prod-search-input"
                    />
                </div>
                <Select value={catFilter} onValueChange={setCatFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="inv-prod-cat-filter">
                        <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {CATEGORIAS.map(c => (
                            <SelectItem key={c.codigo} value={c.codigo}>{c.nombre}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="w-[160px]" data-testid="inv-prod-stock-filter">
                        <SelectValue placeholder="Stock" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Cualquier stock</SelectItem>
                        <SelectItem value="low">Stock bajo</SelectItem>
                        <SelectItem value="out">Sin stock</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card overflow-hidden" data-testid="inv-prod-table">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-14"></TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Costo</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Margen</TableHead>
                            <TableHead className="text-center">Stock</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="py-10 text-center text-muted-foreground" data-testid="inv-prod-empty">
                                    {query || catFilter !== 'all' || stockFilter !== 'all'
                                        ? 'Sin resultados para los filtros aplicados.'
                                        : 'No hay productos aún.'}
                                </TableCell>
                            </TableRow>
                        ) : filtered.map(p => {
                            const cat = CATEGORIAS.find(c => c.codigo === p.categoria);
                            const lowStock = p.stock > 0 && p.stock <= p.minimo;
                            const outOfStock = p.stock === 0;
                            return (
                                <TableRow key={p.id} data-testid={`inv-prod-row-${p.id}`}>
                                    <TableCell>
                                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                            <ImageIcon className="h-4 w-4" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                                    <TableCell>
                                        <p className="font-medium text-foreground">{p.nombre}</p>
                                        <p className="text-[11px] text-muted-foreground">{p.unidad}</p>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center gap-2">
                                            <span className={cn("inline-block w-2 h-2 rounded-full", cat?.color || 'bg-slate-400')} />
                                            <span className="text-sm">{cat?.nombre || p.categoria}</span>
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground tabular-nums">{fmtRD(p.costo)}</TableCell>
                                    <TableCell className="text-right font-semibold tabular-nums">{fmtRD(p.precio)}</TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        <span className={cn(
                                            "text-xs font-medium px-2 py-0.5 rounded-full",
                                            margen(p) >= 30 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                                        )}>
                                            {margen(p).toFixed(1)}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <span className={cn(
                                                "font-semibold tabular-nums",
                                                outOfStock && "text-destructive",
                                                lowStock && "text-warning",
                                                !outOfStock && !lowStock && "text-foreground"
                                            )}>
                                                {p.stock}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">mín. {p.minimo}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {!p.activo ? (
                                            <Badge variant="outline" className="text-muted-foreground gap-1">
                                                <XCircle className="h-3 w-3" /> Inactivo
                                            </Badge>
                                        ) : outOfStock ? (
                                            <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1">
                                                <XCircle className="h-3 w-3" /> Sin stock
                                            </Badge>
                                        ) : lowStock ? (
                                            <Badge className="bg-warning/15 text-warning border-warning/30 gap-1">
                                                <AlertTriangle className="h-3 w-3" /> Stock bajo
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-success/15 text-success border-success/30 gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Disponible
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`inv-prod-edit-${p.id}`} aria-label="Editar">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p)} data-testid={`inv-prod-delete-${p.id}`} aria-label="Eliminar">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
                        <DialogDescription>
                            {editing ? 'Modifica los datos del producto.' : 'Agrega un nuevo producto al catálogo.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-4 mt-2">
                        <div className="col-span-2 sm:col-span-1">
                            <Label htmlFor="sku">SKU / Código de barras *</Label>
                            <Input
                                id="sku"
                                placeholder="7702011099054"
                                value={form.sku}
                                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                data-testid="inv-prod-form-sku"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <Label htmlFor="categoria">Categoría *</Label>
                            <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                                <SelectTrigger id="categoria" data-testid="inv-prod-form-categoria">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIAS.map(c => (
                                        <SelectItem key={c.codigo} value={c.codigo}>{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="nombre">Nombre *</Label>
                            <Input
                                id="nombre"
                                placeholder="Coca-Cola 600 ml"
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                data-testid="inv-prod-form-nombre"
                            />
                        </div>
                        <div>
                            <Label htmlFor="unidad">Unidad</Label>
                            <Select value={form.unidad} onValueChange={(v) => setForm({ ...form, unidad: v })}>
                                <SelectTrigger id="unidad" data-testid="inv-prod-form-unidad">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {UNIDADES.map(u => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="costo">Costo (RD$)</Label>
                            <Input
                                id="costo"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={form.costo}
                                onChange={(e) => setForm({ ...form, costo: e.target.value })}
                                data-testid="inv-prod-form-costo"
                            />
                        </div>
                        <div>
                            <Label htmlFor="precio">Precio (RD$) *</Label>
                            <Input
                                id="precio"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={form.precio}
                                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                                data-testid="inv-prod-form-precio"
                            />
                        </div>
                        <div>
                            <Label htmlFor="stock">Stock actual</Label>
                            <Input
                                id="stock"
                                type="number"
                                placeholder="0"
                                value={form.stock}
                                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                data-testid="inv-prod-form-stock"
                            />
                        </div>
                        <div>
                            <Label htmlFor="minimo">Stock mínimo</Label>
                            <Input
                                id="minimo"
                                type="number"
                                placeholder="0"
                                value={form.minimo}
                                onChange={(e) => setForm({ ...form, minimo: e.target.value })}
                                data-testid="inv-prod-form-minimo"
                            />
                        </div>
                        <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="text-sm font-medium">Producto activo</p>
                                <p className="text-xs text-muted-foreground">Si está inactivo no estará disponible en el POS.</p>
                            </div>
                            <Switch
                                checked={form.activo}
                                onCheckedChange={(v) => setForm({ ...form, activo: v })}
                                data-testid="inv-prod-form-activo"
                            />
                        </div>
                        <DialogFooter className="col-span-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={saving} data-testid="inv-prod-form-submit">
                                {saving ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando…</>) : (editing ? 'Guardar cambios' : 'Crear producto')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const KpiTile = ({ icon: Icon, label, value, accent, caption, testId }) => (
    <div className="rounded-xl border bg-card p-5" data-testid={testId}>
        <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            accent === 'warning' && 'bg-warning/10 text-warning',
            accent === 'destructive' && 'bg-destructive/10 text-destructive',
            accent === 'accent' && 'bg-accent/15 text-accent',
            !accent && 'bg-primary/10 text-primary'
        )}>
            <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-3 font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
        {caption && <p className="text-xs text-muted-foreground mt-1">{caption}</p>}
    </div>
);

export default InventarioProductos;
