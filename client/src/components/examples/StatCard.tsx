import StatCard from '../StatCard';
import { FileText, Users, Clock, CheckCircle } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
      <StatCard
        title="My Requests"
        value="12"
        icon={FileText}
        accentColor="teal"
        trend={{ value: "3 this week", isPositive: true }}
      />
      <StatCard
        title="Pending Approvals"
        value="8"
        icon={Clock}
        accentColor="warning"
        trend={{ value: "2 urgent", isPositive: false }}
      />
      <StatCard
        title="Active Projects"
        value="24"
        icon={Users}
        accentColor="orange"
      />
      <StatCard
        title="Completed"
        value="156"
        icon={CheckCircle}
        accentColor="success"
        trend={{ value: "12 this month", isPositive: true }}
      />
    </div>
  );
}
