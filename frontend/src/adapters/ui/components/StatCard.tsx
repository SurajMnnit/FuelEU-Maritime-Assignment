import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className,
  variant = 'default'
}: StatCardProps) {
  const variantStyles = {
    default: 'border-l-4 border-l-primary',
    primary: 'border-l-4 border-l-primary bg-primary/5',
    success: 'border-l-4 border-l-success bg-success/5',
    warning: 'border-l-4 border-l-warning bg-warning/5',
    destructive: 'border-l-4 border-l-destructive bg-destructive/5',
  };

  const valueColors = {
    default: 'text-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  };

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-200", variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardDescription>
        {Icon && (
          <div className={cn(
            "p-2 rounded-lg",
            variant === 'primary' && "bg-primary/10 text-primary",
            variant === 'success' && "bg-success/10 text-success",
            variant === 'warning' && "bg-warning/10 text-warning",
            variant === 'destructive' && "bg-destructive/10 text-destructive",
            variant === 'default' && "bg-primary/10 text-primary"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", valueColors[variant])}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
        {trend && (
          <div className={cn(
            "text-xs mt-3 font-medium flex items-center gap-1",
            trend.isPositive ? 'text-success' : 'text-destructive'
          )}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground">vs previous</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
