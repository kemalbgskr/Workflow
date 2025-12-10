import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: "teal" | "orange" | "success" | "warning";
  isLoading?: boolean;
}

export default function StatCard({ title, value, icon: Icon, trend, accentColor = "teal", isLoading = false }: StatCardProps) {
  const accentColors = {
    teal: "bg-brand-teal",
    orange: "bg-brand-orange",
    success: "bg-success",
    warning: "bg-warning",
  };

  return (
    <Card className="relative overflow-hidden" data-testid="card-stat">
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentColors[accentColor]}`} />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-2" />
            ) : (
              <p className="text-2xl font-semibold mt-2" data-testid="text-stat-value">{value}</p>
            )}
            {trend && !isLoading && (
              <p className={`text-xs mt-2 ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${accentColors[accentColor]}/10`}>
            <Icon className={`h-6 w-6 ${accentColors[accentColor].replace('bg-', 'text-')}`} />
          </div>
        </div>
      </div>
    </Card>
  );
}