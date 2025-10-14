import CommentThread from '../CommentThread';

export default function CommentThreadExample() {
  const comments = [
    {
      id: "1",
      author: { name: "John Doe", initials: "JD" },
      body: "Please update section 3.2 to include the new security requirements.",
      createdAt: "2 hours ago"
    },
    {
      id: "2",
      author: { name: "Jane Smith", initials: "JS" },
      body: "I've reviewed the changes and they look good. Approving once the security updates are in.",
      createdAt: "1 hour ago"
    },
    {
      id: "3",
      author: { name: "Mike Johnson", initials: "MJ" },
      body: "Security requirements have been added. Ready for final review.",
      createdAt: "30 minutes ago"
    }
  ];

  const handleAddComment = (body: string) => {
    console.log('New comment added:', body);
  };

  return (
    <div className="max-w-2xl p-8">
      <h3 className="text-lg font-semibold mb-6">Document Comments</h3>
      <CommentThread comments={comments} onAddComment={handleAddComment} />
    </div>
  );
}
