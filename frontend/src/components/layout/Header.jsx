import React from 'react';
import { Bell, Search, Moon, Sun, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const Header = ({ sidebarCollapsed = false }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <header className={cn(
            "fixed top-0 right-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b transition-all duration-300",
            sidebarCollapsed ? "left-[70px]" : "left-[260px]"
        )}>
            <div className="flex items-center justify-between h-full px-6">
                {/* Search Bar */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar facturas, clientes..."
                            className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {isDark ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </Button>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-muted-foreground hover:text-foreground"
                            >
                                <Bell className="h-5 w-5" />
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive">
                                    3
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                Notificaciones
                                <Badge variant="secondary" className="text-xs">3 nuevas</Badge>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto">
                                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-accent" />
                                        <span className="font-medium text-sm">Factura pagada</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-4">
                                        La factura #F-2024-0125 ha sido pagada
                                    </p>
                                    <span className="text-[10px] text-muted-foreground pl-4">Hace 5 min</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-warning" />
                                        <span className="font-medium text-sm">Factura por vencer</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-4">
                                        La factura #F-2024-0118 vence en 2 días
                                    </p>
                                    <span className="text-[10px] text-muted-foreground pl-4">Hace 1 hora</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span className="font-medium text-sm">Nueva factura creada</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-4">
                                        Se ha creado la factura #F-2024-0126
                                    </p>
                                    <span className="text-[10px] text-muted-foreground pl-4">Hace 2 horas</span>
                                </DropdownMenuItem>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="justify-center text-primary cursor-pointer">
                                Ver todas las notificaciones
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 px-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                        {getInitials(user?.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium">{user?.name || 'Usuario'}</p>
                                    <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Configuración</DropdownMenuItem>
                            <DropdownMenuItem>Soporte</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                Cerrar sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};

export default Header;
