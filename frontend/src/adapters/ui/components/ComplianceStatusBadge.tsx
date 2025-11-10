import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Minus } from "lucide-react";

interface ComplianceStatusBadgeProps {
  status: 'compliant' | 'non-compliant' | 'surplus' | 'deficit' | 'neutral';
  className?: string;
}

export function ComplianceStatusBadge({ status, className }: ComplianceStatusBadgeProps) {
  const config = {
    compliant: {
      label: 'Compliant',
      variant: 'default' as const,
      icon: CheckCircle2,
      className: 'bg-success text-success-foreground hover:bg-success/90',
    },
    'non-compliant': {
      label: 'Non-Compliant',
      variant: 'destructive' as const,
      icon: XCircle,
      className: '',
    },
    surplus: {
      label: 'Surplus',
      variant: 'default' as const,
      icon: CheckCircle2,
      className: 'bg-success text-success-foreground hover:bg-success/90',
    },
    deficit: {
      label: 'Deficit',
      variant: 'destructive' as const,
      icon: XCircle,
      className: '',
    },
    neutral: {
      label: 'Neutral',
      variant: 'secondary' as const,
      icon: Minus,
      className: '',
    },
  };

  const { label, variant, icon: Icon, className: statusClassName } = config[status];

  return (
    <Badge variant={variant} className={`${statusClassName} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
