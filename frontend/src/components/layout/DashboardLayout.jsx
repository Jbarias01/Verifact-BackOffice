import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

export const DashboardLayout = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
                        <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <Header sidebarCollapsed={sidebarCollapsed} />
            <main className={cn(
                "pt-16 min-h-screen transition-all duration-300",
                sidebarCollapsed ? "ml-[70px]" : "ml-[260px]"
            )}>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
