import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="space-y-6 p-8">
      <div>
        <h3 className="text-sm font-medium mb-3">Document Status</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="DRAFT" />
          <StatusBadge status="IN_REVIEW" />
          <StatusBadge status="SIGNING" />
          <StatusBadge status="SIGNED" />
          <StatusBadge status="REJECTED" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Approver Status</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="PENDING" />
          <StatusBadge status="SIGNED" />
          <StatusBadge status="DECLINED" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Project Status</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="Initiative Submitted" />
          <StatusBadge status="Initiative Approved" />
          <StatusBadge status="Kick Off" />
          <StatusBadge status="Go Live" />
        </div>
      </div>
    </div>
  );
}
