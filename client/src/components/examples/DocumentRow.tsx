import DocumentRow from '../DocumentRow';

export default function DocumentRowExample() {
  return (
    <div className="space-y-3 p-8">
      <DocumentRow
        id="1"
        filename="Feasibility_Study_v3.pdf"
        type="FS"
        version={3}
        status="SIGNED"
        uploadedBy="John Doe"
        uploadedAt="2 days ago"
        onView={() => console.log('View clicked')}
        onConfigure={() => console.log('Configure clicked')}
        onSend={() => console.log('Send clicked')}
        onDownload={() => console.log('Download clicked')}
      />
      <DocumentRow
        id="2"
        filename="Business_Requirements_v2.pdf"
        type="BRD"
        version={2}
        status="SIGNING"
        uploadedBy="Jane Smith"
        uploadedAt="1 day ago"
        onView={() => console.log('View clicked')}
        onConfigure={() => console.log('Configure clicked')}
        onSend={() => console.log('Send clicked')}
        onDownload={() => console.log('Download clicked')}
      />
      <DocumentRow
        id="3"
        filename="Project_Charter_Draft.pdf"
        type="PROJECT_CHARTER"
        version={1}
        status="DRAFT"
        uploadedBy="Mike Johnson"
        uploadedAt="3 hours ago"
        onView={() => console.log('View clicked')}
        onConfigure={() => console.log('Configure clicked')}
        onSend={() => console.log('Send clicked')}
        onDownload={() => console.log('Download clicked')}
      />
    </div>
  );
}
