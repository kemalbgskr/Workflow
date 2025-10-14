import ApproverCard from '../ApproverCard';

export default function ApproverCardExample() {
  return (
    <div className="space-y-3 p-8">
      <div>
        <h3 className="text-sm font-medium mb-4">Sequential Approval</h3>
        <div className="space-y-2">
          <ApproverCard
            name="John Doe"
            initials="JD"
            email="john.doe@bni.co.id"
            role="PMO"
            orderIndex={0}
            status="SIGNED"
            signedAt="2 days ago"
            sequential={true}
          />
          <ApproverCard
            name="Jane Smith"
            initials="JS"
            email="jane.smith@bni.co.id"
            role="ISA"
            orderIndex={1}
            status="SIGNED"
            signedAt="1 day ago"
            sequential={true}
          />
          <ApproverCard
            name="Mike Johnson"
            initials="MJ"
            email="mike.johnson@bni.co.id"
            role="DEV Lead"
            orderIndex={2}
            status="PENDING"
            sequential={true}
          />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-medium mb-4">Parallel Approval</h3>
        <div className="space-y-2">
          <ApproverCard
            name="Sarah Wilson"
            initials="SW"
            email="sarah.wilson@bni.co.id"
            role="CISO"
            status="SIGNED"
            signedAt="3 hours ago"
          />
          <ApproverCard
            name="Tom Brown"
            initials="TB"
            email="tom.brown@bni.co.id"
            role="IFM"
            status="PENDING"
          />
        </div>
      </div>
    </div>
  );
}
