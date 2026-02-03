import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    FileText, 
    Users, 
    Building2, 
    Settings, 
    LogOut,
    ChevronLeft,
    ChevronRight,
    Receipt,
    FileCheck,
    FileClock,
    BarChart3,
    HelpCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const menuItems = [
    {
        title: 'Principal',
        items: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
            { name: 'Facturas', icon: FileText, path: '/dashboard/facturas' },
            { name: 'Clientes', icon: Users, path: '/dashboard/clientes' },
        ]
    },
    {
        title: 'Facturación',
        items: [
            { name: 'Emitidas', icon: FileCheck, path: '/dashboard/emitidas' },
            { name: 'Pendientes', icon: FileClock, path: '/dashboard/pendientes' },
            { name: 'Comprobantes', icon: Receipt, path: '/dashboard/comprobantes' },
        ]
    },
    {
        title: 'Administración',
        items: [
            { name: 'Reportes', icon: BarChart3, path: '/dashboard/reportes' },
            { name: 'Empresa', icon: Building2, path: '/dashboard/empresa' },
            { name: 'Configuración', icon: Settings, path: '/dashboard/configuracion' },
        ]
    }
];

export const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout, company } = useAuth();
    const location = useLocation();

    const renderNavItem = (item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
            <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-sidebar-hover group",
                    isActive && "bg-sidebar-active text-primary-foreground",
                    !isActive && "text-sidebar-foreground"
                )}
                title={isCollapsed ? item.name : undefined}
            >
                <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary-foreground" : "text-sidebar-muted group-hover:text-sidebar-foreground"
                )} />
                {!isCollapsed && (
                    <span className="text-sm font-medium">
                        {item.name}
                    </span>
                )}
            </NavLink>
        );
    };

    return (
        <aside className={cn(
            "fixed left-0 top-0 z-40 h-screen bg-sidebar-bg transition-all duration-300 flex flex-col",
            isCollapsed ? "w-[70px]" : "w-[260px]"
        )}>
            {/* Logo Section */}
            <div className={cn(
                "flex items-center h-16 px-4 border-b border-sidebar-hover",
                isCollapsed ? "justify-center" : "justify-between"
            )}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <FileCheck className="h-5 w-5 text-primary-foreground" />
                    </div>
                    {!isCollapsed && (
                        <div>
                            <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">
                                Verifact
                            </h1>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4">
                {menuItems.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        {!isCollapsed && (
                            <p className="text-xs font-semibold text-sidebar-muted uppercase tracking-wider px-3 mb-2">
                                {section.title}
                            </p>
                        )}
                        <div className="space-y-1">
                            {section.items.map(renderNavItem)}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Company Info & Actions */}
            <div className="border-t border-sidebar-hover p-3">
                {!isCollapsed && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-sidebar-hover/50">
                        <p className="text-xs text-sidebar-muted">Empresa</p>
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                            {company?.name || 'Mi Empresa'}
                        </p>
                        <p className="text-xs text-sidebar-muted">
                            RNC: {company?.rnc || '000-000-000'}
                        </p>
                    </div>
                )}
                
                <div className="flex items-center gap-2">
                    {isCollapsed ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="w-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover"
                            title="Cerrar sesión"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover"
                            >
                                <HelpCircle className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={logout}
                                className="flex-1 justify-start text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Cerrar sesión
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Collapse Toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                    "absolute -right-3 top-20 h-6 w-6 rounded-full border bg-card shadow-md",
                    "text-muted-foreground hover:text-foreground hover:bg-card"
                )}
            >
                {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                ) : (
                    <ChevronLeft className="h-4 w-4" />
                )}
            </Button>
        </aside>
    );
};

export default Sidebar;
