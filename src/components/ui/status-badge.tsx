import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
type StatusType = 'pass' | 'fail' | 'warning' | 'processing';
interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    pass: {
      label: 'Pass',
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      icon: CheckCircle2
    },
    fail: {
      label: 'Fail',
      color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      icon: XCircle
    },
    warning: {
      label: 'Warning',
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      icon: AlertTriangle
    },
    processing: {
      label: 'Processing',
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      icon: Loader2
    }
  };
  const { label, color, icon: Icon } = config[status];
  return (
    <Badge variant="outline" className={cn("px-2 py-0.5 font-medium gap-1.5", color, className)}>
      <Icon className={cn("h-3.5 w-3.5", status === 'processing' && "animate-spin")} />
      {label.toUpperCase()}
    </Badge>
  );
}