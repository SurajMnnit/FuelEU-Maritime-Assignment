import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ComplianceStatusBadgeProps {
  status: 'compliant' | 'non-compliant' | 'surplus' | 'deficit' | 'neutral';
  className?: string;
}

export function ComplianceStatusBadge({ status, className }: ComplianceStatusBadgeProps) {
  const config = {
    compliant: {
      label: 'Compliant',
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
      iconClassName: 'text-green-600',
    },
    'non-compliant': {
      label: 'Non-Compliant',
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
      iconClassName: 'text-red-600',
    },
    surplus: {
      label: 'Surplus',
      icon: CheckCircle2,
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
      iconClassName: 'text-emerald-600',
    },
    deficit: {
      label: 'Deficit',
      icon: AlertTriangle,
      className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
      iconClassName: 'text-orange-600',
    },
    neutral: {
      label: 'Neutral',
      icon: Minus,
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      iconClassName: 'text-gray-600',
    },
  };

  const { label, icon: Icon, className: statusClassName, iconClassName } = config[status];

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "border-2 font-semibold px-3 py-1 flex items-center gap-1.5 transition-colors",
        statusClassName,
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
      <span>{label}</span>
    </Badge>
  );
}
