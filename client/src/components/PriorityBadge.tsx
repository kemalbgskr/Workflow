import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return { 
          label: '🔴 Critical', 
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'HIGH':
        return { 
          label: '🟠 High', 
          variant: 'secondary' as const,
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case 'MEDIUM':
        return { 
          label: '🟡 Medium', 
          variant: 'outline' as const,
          className: 'bg-yellow-50 text-yellow-800 border-yellow-200'
        };
      case 'LOW':
        return { 
          label: '🟢 Low', 
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      default:
        return { 
          label: '🟡 Medium', 
          variant: 'outline' as const,
          className: 'bg-yellow-50 text-yellow-800 border-yellow-200'
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
}