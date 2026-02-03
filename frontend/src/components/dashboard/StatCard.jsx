import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendValue,
    variant = 'default',
    className 
}) => {
    const variants = {
        default: 'bg-card',
        primary: 'bg-primary-light',
        accent: 'bg-accent-light',
        warning: 'bg-warning-light',
        success: 'bg-success-light'
    };

    const iconVariants = {
        default: 'bg-secondary text-primary',
        primary: 'bg-primary/20 text-primary',
        accent: 'bg-accent/20 text-accent',
        warning: 'bg-warning/20 text-warning',
        success: 'bg-success/20 text-success'
    };

    return (
        <div className={cn(
            "rounded-xl border p-6 transition-all duration-300 hover:shadow-card-hover card-interactive",
            variants[variant],
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-foreground tracking-tight">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 mt-2",
                            trend === 'up' ? 'text-success' : 'text-destructive'
                        )}>
                            {trend === 'up' ? (
                                <TrendingUp className="h-4 w-4" />
                            ) : (
                                <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium">{trendValue}</span>
                            <span className="text-xs text-muted-foreground">vs mes anterior</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={cn(
                        "p-3 rounded-xl",
                        iconVariants[variant]
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
