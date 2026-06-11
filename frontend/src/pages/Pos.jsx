import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, ScanLine, X, Plus, Minus, Trash2, User, UserPlus,
    Clock, Store, FileText, Percent, Pause, Receipt,
    Tag, ShoppingCart, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

// =========== DUMMY DATA (will be replaced with real API once endpoints are provided) ===========
const CATEGORIAS = [
    { id: 'all', nombre: 'Todos', icon: Tag, count: 248 },
    { id: 'beb', nombre: 'Bebidas', icon: Tag, count: 64 },
    { id: 'sna', nombre: 'Snacks', icon: Tag, count: 38 },
    { id: 'des', nombre: 'Desayuno', icon: Tag, count: 22 },
    { id: 'lim', nombre: 'Limpieza', icon: Tag, count: 41 },
    { id: 'lac', nombre: 'Lácteos', icon: Tag, count: 18 },
    { id: 'pan', nombre: 'Panadería', icon: Tag, count: 15 },
];

const PRODUCT_BEB = 'https://images.unsplash.com/photo-1696739696220-8d2e27465662?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxiZXZlcmFnZSUyMGRyaW5rJTIwY2FufGVufDB8fHx8MTc4MTE0Nzk3M3ww&ixlib=rb-4.1.0&q=85';
const PRODUCT_SNA = 'https://images.unsplash.com/photo-1708746333830-6a40a841e810?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHw0fHxzbmFjayUyMGJhZyUyMGNoaXBzfGVufDB8fHx8MTc4MTE0Nzk3M3ww&ixlib=rb-4.1.0&q=85';
const PRODUCT_LIM = 'https://images.unsplash.com/photo-1563453392212-326f5e854473?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbmluZyUyMHN1cHBsaWVzJTIwYm90dGxlfGVufDB8fHx8MTc4MTE0Nzk3M3ww&ixlib=rb-4.1.0&q=85';

const PRODUCTOS = [
    { id: '01', cat: 'beb', sku: '7702011099054', nombre: 'Coca-Cola 600 ml', precio: 65, stock: 142, img: PRODUCT_BEB },
    { id: '02', cat: 'beb', sku: '7702011001234', nombre: 'Sprite 600 ml', precio: 65, stock: 98, img: PRODUCT_BEB },
    { id: '03', cat: 'beb', sku: '7702011004444', nombre: 'Pepsi Lata 355 ml', precio: 55, stock: 76, img: PRODUCT_BEB },
    { id: '04', cat: 'beb', sku: '7702011005555', nombre: 'Red Bull 250 ml', precio: 175, stock: 24, img: PRODUCT_BEB },
    { id: '05', cat: 'sna', sku: '7501031311111', nombre: 'Doritos Nacho 45g', precio: 70, stock: 38, img: PRODUCT_SNA },
    { id: '06', cat: 'sna', sku: '7501031322222', nombre: 'Lays Original 50g', precio: 65, stock: 52, img: PRODUCT_SNA },
    { id: '07', cat: 'sna', sku: '7501031333333', nombre: 'Cheetos Flamin Hot', precio: 75, stock: 41, img: PRODUCT_SNA },
    { id: '08', cat: 'sna', sku: '7501031344444', nombre: 'Pringles Original 124g', precio: 195, stock: 18, img: PRODUCT_SNA },
    { id: '09', cat: 'lim', sku: '7591234560001', nombre: 'Cloro Mistolín 1 L', precio: 95, stock: 28, img: PRODUCT_LIM },
    { id: '10', cat: 'lim', sku: '7591234560002', nombre: 'Detergente Ariel 250g', precio: 145, stock: 32, img: PRODUCT_LIM },
    { id: '11', cat: 'lim', sku: '7591234560003', nombre: 'Jabón Dove Barra', precio: 85, stock: 56, img: PRODUCT_LIM },
    { id: '12', cat: 'des', sku: '7501030400001', nombre: 'Café Santo Domingo 1lb', precio: 285, stock: 22, img: PRODUCT_BEB },
];

const INITIAL_CART = [
    { ...PRODUCTOS[0], qty: 2 },
    { ...PRODUCTOS[4], qty: 1 },
    { ...PRODUCTOS[11], qty: 1 },
];

const fmtRD = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(n);

const ProductCard = ({ producto, onAdd }) => {
    const lowStock = producto.stock <= 20;
    return (
        <button
            type="button"
            onClick={() => onAdd(producto)}
            data-testid={`pos-product-${producto.id}`}
            className="group relative rounded-xl border bg-card overflow-hidden text-left hover:border-primary hover:shadow-md transition-all"
        >
            <div className="aspect-square bg-muted relative overflow-hidden">
                <img
                    src={producto.img}
                    alt={producto.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                {lowStock && (
                    <Badge className="absolute top-2 left-2 bg-warning/95 text-warning-foreground border-warning text-[10px] py-0">
                        Stock {producto.stock}
                    </Badge>
                )}
                <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                    <Plus className="h-4 w-4" />
                </div>
            </div>
            <div className="p-3">
                <p className="text-[11px] text-muted-foreground font-mono">{producto.sku.slice(-6)}</p>
                <p className="text-sm font-medium text-foreground mt-0.5 line-clamp-2 leading-tight" style={{ minHeight: '2.5rem' }}>
                    {producto.nombre}
                </p>
                <p className="text-base font-bold text-foreground mt-1.5">{fmtRD(producto.precio)}</p>
            </div>
        </button>
    );
};

const Kbd = ({ children }) => (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md border bg-card text-[10px] font-semibold text-muted-foreground">
        {children}
    </kbd>
);

const Pos = () => {
    const { user } = useAuth();
    const [activeCat, setActiveCat] = useState('all');
    const [query, setQuery] = useState('');
    const [cart, setCart] = useState(INITIAL_CART);
    const [cliente] = useState({ nombre: 'Consumidor Final', rnc: null });
    const [tipoEcf, setTipoEcf] = useState('B02');

    // Keyboard shortcuts (F2/F4/Esc)
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                document.querySelector('[data-testid="pos-search-input"]')?.focus();
            } else if (e.key === 'Escape') {
                setQuery('');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const filtered = useMemo(() => {
        let list = PRODUCTOS;
        if (activeCat !== 'all') list = list.filter(p => p.cat === activeCat);
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(p => p.nombre.toLowerCase().includes(q) || p.sku.includes(q));
        }
        return list;
    }, [activeCat, query]);

    const addToCart = (producto) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === producto.id);
            if (existing) return prev.map(i => i.id === producto.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { ...producto, qty: 1 }];
        });
    };
    const inc = (id) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
    const dec = (id) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i));
    const remove = (id) => setCart(prev => prev.filter(i => i.id !== id));

    const subtotal = cart.reduce((s, i) => s + i.precio * i.qty, 0);
    const itbis = subtotal * 0.18;
    const descuento = 0;
    const total = subtotal + itbis - descuento;

    const sucursalName = user?.sucursal?.nombre || 'Sucursal';
    const cajeroName = user?.name?.split(' ')[0] || 'Cajero';

    return (
        // DashboardLayout already provides padding p-6 around <Outlet/>.
        // We compensate by going edge-to-edge inside that wrapper.
        <div className="-m-6 h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
            {/* Slim demo banner */}
            <div className="bg-warning/15 text-warning text-[11px] font-semibold uppercase tracking-widest text-center py-1 border-b border-warning/30 flex-shrink-0" data-testid="pos-demo-banner">
                Datos de prueba · Conexión con API pendiente
            </div>

            {/* Mini-toolbar (cashier + branch + clock) */}
            <div className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-card/40 flex-shrink-0" data-testid="pos-toolbar">
                <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
                    <span className="inline-flex items-center gap-1.5 truncate">
                        <Store className="h-3.5 w-3.5" />
                        <span className="truncate">{sucursalName}</span>
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Caja abierta desde 8:00 am
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Cajero:</span>
                    <span className="font-medium text-foreground">{cajeroName}</span>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 grid grid-cols-12 overflow-hidden">

                {/* LEFT: Products */}
                <section className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col overflow-hidden border-r">
                    <div className="p-4 border-b bg-card/40">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Busca por nombre o escanea un código..."
                                    className="pl-10 h-12 text-base"
                                    data-testid="pos-search-input"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <Kbd>F2</Kbd>
                                </span>
                            </div>
                            <Button variant="outline" className="h-12 px-4" data-testid="pos-scan-button">
                                <ScanLine className="h-5 w-5" />
                                <span className="ml-2 hidden md:inline">Escanear</span>
                            </Button>
                        </div>
                    </div>

                    <div className="px-4 py-3 border-b bg-card/20 flex items-center gap-2 overflow-x-auto" data-testid="pos-categories">
                        {CATEGORIAS.map(c => {
                            const Icon = c.icon;
                            const active = activeCat === c.id;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setActiveCat(c.id)}
                                    data-testid={`pos-cat-${c.id}`}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm whitespace-nowrap transition-all",
                                        active
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-card text-foreground hover:border-primary/40"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {c.nombre}
                                    <span className={cn(
                                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                                        active ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {c.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3" data-testid="pos-products-grid">
                            {filtered.map(p => (
                                <ProductCard key={p.id} producto={p} onAdd={addToCart} />
                            ))}
                        </div>
                        {filtered.length === 0 && (
                            <div className="py-20 text-center text-muted-foreground">
                                <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                <p>No encontramos productos.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* RIGHT: Cart */}
                <aside className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col bg-card overflow-hidden" data-testid="pos-cart">
                    <div className="p-4 border-b">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Cliente</p>
                        <button
                            type="button"
                            className="w-full inline-flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-background hover:border-primary/40 transition"
                            data-testid="pos-cliente-button"
                        >
                            <div className="inline-flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{cliente.nombre}</p>
                                    <p className="text-[10px] text-muted-foreground">{cliente.rnc || 'Sin RNC asociado'}</p>
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-2">
                                <Kbd>F3</Kbd>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </button>
                        <button
                            type="button"
                            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-xs text-primary hover:underline"
                            data-testid="pos-cliente-new"
                        >
                            <UserPlus className="h-3.5 w-3.5" />
                            Crear cliente al vuelo
                        </button>
                    </div>

                    <div className="px-4 py-3 border-b">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2 inline-flex items-center gap-1.5">
                            <FileText className="h-3 w-3" />
                            Tipo de comprobante
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { v: 'B02', l: 'Consumo' },
                                { v: 'B01', l: 'Crédito fiscal' },
                            ].map(opt => (
                                <button
                                    key={opt.v}
                                    type="button"
                                    onClick={() => setTipoEcf(opt.v)}
                                    data-testid={`pos-ecf-${opt.v}`}
                                    className={cn(
                                        "rounded-md border text-xs py-2 transition",
                                        tipoEcf === opt.v
                                            ? "bg-primary/5 border-primary text-primary font-semibold"
                                            : "bg-background hover:border-primary/40"
                                    )}
                                >
                                    {opt.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2" data-testid="pos-cart-lines">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center px-6 text-muted-foreground">
                                <ShoppingCart className="h-10 w-10 mb-3 opacity-40" />
                                <p className="text-sm">El ticket está vacío.</p>
                                <p className="text-xs mt-1">Busca o toca un producto para agregar.</p>
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {cart.map(item => (
                                    <li key={item.id} className="p-2.5 rounded-lg hover:bg-secondary/40 group" data-testid={`pos-cart-item-${item.id}`}>
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{item.nombre}</p>
                                                <p className="text-[11px] text-muted-foreground font-mono">{item.sku.slice(-6)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => remove(item.id)}
                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                                                data-testid={`pos-cart-remove-${item.id}`}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="inline-flex items-center rounded-md border bg-background">
                                                <button
                                                    type="button"
                                                    onClick={() => dec(item.id)}
                                                    className="w-7 h-7 flex items-center justify-center text-foreground hover:bg-muted rounded-l-md"
                                                    data-testid={`pos-cart-dec-${item.id}`}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-9 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => inc(item.id)}
                                                    className="w-7 h-7 flex items-center justify-center text-foreground hover:bg-muted rounded-r-md"
                                                    data-testid={`pos-cart-inc-${item.id}`}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-muted-foreground">{fmtRD(item.precio)} × {item.qty}</p>
                                                <p className="text-sm font-semibold text-foreground tabular-nums">{fmtRD(item.precio * item.qty)}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="border-t bg-card p-4 space-y-3">
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="tabular-nums">{fmtRD(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>ITBIS (18%)</span>
                                <span className="tabular-nums">{fmtRD(itbis)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <Percent className="h-3 w-3" />
                                    Descuento <Kbd>F5</Kbd>
                                </span>
                                <span className="tabular-nums">{fmtRD(descuento)}</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t flex items-baseline justify-between">
                            <span className="text-sm font-semibold text-foreground">Total</span>
                            <span className="text-3xl font-bold text-foreground tabular-nums">{fmtRD(total)}</span>
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-14 bg-success hover:bg-success/90 text-white text-base font-bold"
                            data-testid="pos-cobrar-button"
                            disabled={cart.length === 0}
                        >
                            <Receipt className="h-5 w-5 mr-2" />
                            Cobrar
                            <span className="ml-3 inline-flex"><Kbd>F4</Kbd></span>
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" data-testid="pos-suspender-button">
                                <Pause className="h-3.5 w-3.5 mr-1.5" />
                                Suspender
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCart([])}
                                disabled={cart.length === 0}
                                data-testid="pos-cancelar-button"
                            >
                                <X className="h-3.5 w-3.5 mr-1.5" />
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Pos;
