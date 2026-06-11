import React, { useMemo, useState } from 'react';
import {
    Tag, Plus, Search, Pencil, Trash2, Boxes, CheckCircle2,
    XCircle, Loader2,
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
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Color palette options for categories
const COLOR_OPTIONS = [
    { name: 'Azul', value: 'bg-blue-500', text: 'text-blue-700', soft: 'bg-blue-50' },
    { name: 'Verde', value: 'bg-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-50' },
    { name: 'Naranja', value: 'bg-orange-500', text: 'text-orange-700', soft: 'bg-orange-50' },
    { name: 'Rosa', value: 'bg-rose-500', text: 'text-rose-700', soft: 'bg-rose-50' },
    { name: 'Morado', value: 'bg-purple-500', text: 'text-purple-700', soft: 'bg-purple-50' },
    { name: 'Amarillo', value: 'bg-yellow-500', text: 'text-yellow-700', soft: 'bg-yellow-50' },
    { name: 'Cian', value: 'bg-cyan-500', text: 'text-cyan-700', soft: 'bg-cyan-50' },
    { name: 'Gris', value: 'bg-slate-500', text: 'text-slate-700', soft: 'bg-slate-50' },
];

// Initial mockup data
const INITIAL_CATEGORIAS = [
    { id: 'beb', codigo: 'BEB', nombre: 'Bebidas', descripcion: 'Refrescos, jugos y aguas embotelladas', color: 'bg-blue-500', productos: 64, activa: true },
    { id: 'sna', codigo: 'SNA', nombre: 'Snacks', descripcion: 'Frituras, golosinas y dulces', color: 'bg-orange-500', productos: 38, activa: true },
    { id: 'des', codigo: 'DES', nombre: 'Desayuno', descripcion: 'Café, cereales, pan y avena', color: 'bg-yellow-500', productos: 22, activa: true },
    { id: 'lim', codigo: 'LIM', nombre: 'Limpieza', descripcion: 'Productos del hogar y aseo personal', color: 'bg-cyan-500', productos: 41, activa: true },
    { id: 'lac', codigo: 'LAC', nombre: 'Lácteos', descripcion: 'Leche, yogures, mantequilla y quesos', color: 'bg-purple-500', productos: 18, activa: true },
    { id: 'pan', codigo: 'PAN', nombre: 'Panadería', descripcion: 'Pan, repostería y galletas', color: 'bg-rose-500', productos: 15, activa: true },
    { id: 'enl', codigo: 'ENL', nombre: 'Enlatados', descripcion: 'Atún, sardinas y conservas', color: 'bg-emerald-500', productos: 12, activa: false },
];

const newId = () => Math.random().toString(36).slice(2, 8);

const InventarioCategorias = () => {
    const [categorias, setCategorias] = useState(INITIAL_CATEGORIAS);
    const [query, setQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', color: 'bg-blue-500', activa: true });

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return categorias;
        return categorias.filter(c =>
            c.nombre.toLowerCase().includes(q) ||
            c.codigo.toLowerCase().includes(q) ||
            (c.descripcion || '').toLowerCase().includes(q)
        );
    }, [categorias, query]);

    const activas = categorias.filter(c => c.activa).length;
    const totalProductos = categorias.reduce((s, c) => s + c.productos, 0);

    const openCreate = () => {
        setEditing(null);
        setForm({ codigo: '', nombre: '', descripcion: '', color: 'bg-blue-500', activa: true });
        setDialogOpen(true);
    };

    const openEdit = (cat) => {
        setEditing(cat);
        setForm({
            codigo: cat.codigo,
            nombre: cat.nombre,
            descripcion: cat.descripcion || '',
            color: cat.color,
            activa: cat.activa,
        });
        setDialogOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.codigo.trim() || !form.nombre.trim()) {
            toast.error('Código y Nombre son obligatorios');
            return;
        }
        setSaving(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 500));
        if (editing) {
            setCategorias(prev => prev.map(c => c.id === editing.id ? { ...c, ...form, codigo: form.codigo.toUpperCase() } : c));
            toast.success('Categoría actualizada');
        } else {
            setCategorias(prev => [
                ...prev,
                { id: newId(), ...form, codigo: form.codigo.toUpperCase(), productos: 0 },
            ]);
            toast.success('Categoría creada');
        }
        setSaving(false);
        setDialogOpen(false);
    };

    const handleDelete = (cat) => {
        if (cat.productos > 0) {
            toast.error(`No se puede eliminar: tiene ${cat.productos} productos asociados.`);
            return;
        }
        if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;
        setCategorias(prev => prev.filter(c => c.id !== cat.id));
        toast.success('Categoría eliminada');
    };

    return (
        <div className="space-y-6">
            {/* Demo banner */}
            <div className="rounded-md bg-warning/15 border border-warning/30 text-warning text-xs font-semibold uppercase tracking-widest text-center py-1.5" data-testid="inv-cat-demo-banner">
                Datos de prueba · Conexión con API pendiente
            </div>

            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground inline-flex items-center gap-3">
                        <Tag className="h-6 w-6 text-primary" />
                        Categorías
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Organiza tus productos por familias para facilitar la venta en el POS.
                    </p>
                </div>
                <Button onClick={openCreate} data-testid="inv-cat-create-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva categoría
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiTile icon={Tag} label="Total de categorías" value={categorias.length} testId="kpi-total" />
                <KpiTile icon={CheckCircle2} label="Activas" value={activas} accent="success" testId="kpi-activas" />
                <KpiTile icon={Boxes} label="Productos clasificados" value={totalProductos} accent="accent" testId="kpi-productos" />
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por código, nombre o descripción…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                        data-testid="inv-cat-search-input"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card overflow-hidden" data-testid="inv-cat-table">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">Color</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-center">Productos</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground" data-testid="inv-cat-empty">
                                    {query ? 'Sin resultados para tu búsqueda.' : 'No hay categorías aún.'}
                                </TableCell>
                            </TableRow>
                        ) : filtered.map(cat => (
                            <TableRow key={cat.id} data-testid={`inv-cat-row-${cat.id}`}>
                                <TableCell>
                                    <span className={cn("inline-block w-6 h-6 rounded-md", cat.color)} />
                                </TableCell>
                                <TableCell className="font-mono text-xs">{cat.codigo}</TableCell>
                                <TableCell className="font-medium text-foreground">{cat.nombre}</TableCell>
                                <TableCell className="text-muted-foreground text-sm max-w-md">{cat.descripcion || '—'}</TableCell>
                                <TableCell className="text-center font-semibold">{cat.productos}</TableCell>
                                <TableCell>
                                    {cat.activa ? (
                                        <Badge className="bg-success/15 text-success border-success/30 gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Activa
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground gap-1">
                                            <XCircle className="h-3 w-3" /> Inactiva
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} data-testid={`inv-cat-edit-${cat.id}`} aria-label="Editar">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat)} data-testid={`inv-cat-delete-${cat.id}`} aria-label="Eliminar">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Dialog: create/edit */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
                        <DialogDescription>
                            {editing ? 'Modifica los datos de la categoría.' : 'Crea una nueva categoría para clasificar tus productos.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 mt-2">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                                <Label htmlFor="codigo">Código *</Label>
                                <Input
                                    id="codigo"
                                    placeholder="BEB"
                                    value={form.codigo}
                                    onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase().slice(0, 6) })}
                                    data-testid="inv-cat-form-codigo"
                                    autoFocus
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="nombre">Nombre *</Label>
                                <Input
                                    id="nombre"
                                    placeholder="Bebidas"
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                    data-testid="inv-cat-form-nombre"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Input
                                id="descripcion"
                                placeholder="Descripción breve…"
                                value={form.descripcion}
                                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                data-testid="inv-cat-form-descripcion"
                            />
                        </div>
                        <div>
                            <Label>Color</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {COLOR_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, color: opt.value })}
                                        data-testid={`inv-cat-color-${opt.name.toLowerCase()}`}
                                        className={cn(
                                            "w-8 h-8 rounded-md transition-transform",
                                            opt.value,
                                            form.color === opt.value
                                                ? "ring-2 ring-offset-2 ring-foreground scale-110"
                                                : "hover:scale-110"
                                        )}
                                        title={opt.name}
                                        aria-label={opt.name}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="text-sm font-medium">Categoría activa</p>
                                <p className="text-xs text-muted-foreground">Si está inactiva no aparecerá en el POS.</p>
                            </div>
                            <Switch
                                checked={form.activa}
                                onCheckedChange={(v) => setForm({ ...form, activa: v })}
                                data-testid="inv-cat-form-activa"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={saving} data-testid="inv-cat-form-submit">
                                {saving ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando…</>) : (editing ? 'Guardar cambios' : 'Crear categoría')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const KpiTile = ({ icon: Icon, label, value, accent, testId }) => (
    <div className="rounded-xl border bg-card p-5" data-testid={testId}>
        <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            accent === 'success' && 'bg-success/10 text-success',
            accent === 'accent' && 'bg-accent/15 text-accent',
            !accent && 'bg-primary/10 text-primary'
        )}>
            <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-3 font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
    </div>
);

export default InventarioCategorias;
