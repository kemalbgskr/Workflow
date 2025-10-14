import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface Comment {
  id: string;
  author: {
    name: string;
    initials: string;
  };
  body: string;
  createdAt: string;
}

interface CommentThreadProps {
  comments: Comment[];
  onAddComment?: (body: string) => void;
}

export default function CommentThread({ comments, onAddComment }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    if (newComment.trim()) {
      console.log("Adding comment:", newComment);
      onAddComment?.(newComment);
      setNewComment("");
    }
  };

  return (
    <div className="space-y-4" data-testid="thread-comments">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-brand-teal text-white text-xs">
              {comment.author.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
            </div>
            <p className="text-sm text-foreground">{comment.body}</p>
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-4 border-t">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            You
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-20 resize-none"
            data-testid="input-new-comment"
          />
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              data-testid="button-add-comment"
            >
              Add Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
