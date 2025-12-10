import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Paperclip, X, Download, Eye, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import FilePreviewDialog from "@/components/FilePreviewDialog";
import { useAuth } from "@/hooks/useAuth";

interface Comment {
  id: string;
  author: {
    name: string;
    initials: string;
  };
  body: string;
  createdAt: string;
  attachmentPath?: string;
  attachmentName?: string;
}

interface CommentThreadProps {
  comments: Comment[];
  onAddComment?: (body: string, file?: File) => void;
  onDeleteComment?: (commentId: string) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function CommentThread({ comments, onAddComment, onDeleteComment }: CommentThreadProps) {
  const { user, hasRole } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; downloadUrl: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  const handleSubmit = () => {
    if (newComment.trim()) {
      console.log("Adding comment:", newComment, "with file:", selectedFile?.name);
      onAddComment?.(newComment, selectedFile || undefined);
      setNewComment("");
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/') || 
          file.type === 'application/pdf' || 
          file.type.includes('document') ||
          file.type === 'text/plain') {
        setSelectedFile(file);
      }
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
              {(hasRole('ADMIN') || comment.author.name === user?.name) && (
                <div className="ml-auto">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    title="Delete comment"
                    onClick={() => onDeleteComment?.(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-sm text-foreground">
              {comment.body.split(/(@\w+\s*\w*)/).map((part, index) => {
                if (part.startsWith('@')) {
                  return (
                    <span key={index} className="text-primary font-medium bg-primary/10 px-1 rounded">
                      {part}
                    </span>
                  );
                }
                return part;
              })}
            </p>
            {comment.attachmentName && (
              <div className="mt-2 p-2 bg-muted rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <button 
                    className="text-sm text-primary hover:underline flex-1 text-left cursor-pointer"
                    onClick={() => {
                      setPreviewFile({
                        name: comment.attachmentName!,
                        url: `/api/comments/${comment.id}/attachment?view=true`,
                        downloadUrl: `/api/comments/${comment.id}/attachment`
                      });
                      setShowPreview(true);
                    }}
                  >
                    {comment.attachmentName}
                  </button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0"
                    title="Preview"
                    onClick={() => {
                      setPreviewFile({
                        name: comment.attachmentName!,
                        url: `/api/comments/${comment.id}/attachment?view=true`,
                        downloadUrl: `/api/comments/${comment.id}/attachment`
                      });
                      setShowPreview(true);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0"
                    title="Download"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `/api/comments/${comment.id}/attachment`;
                      link.download = comment.attachmentName || "";
                      link.click();
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
                {comment.attachmentName.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                  <button
                    onClick={() => {
                      setPreviewFile({
                        name: comment.attachmentName!,
                        url: `/api/comments/${comment.id}/attachment?view=true`,
                        downloadUrl: `/api/comments/${comment.id}/attachment`
                      });
                      setShowPreview(true);
                    }}
                    className="block"
                  >
                    <img 
                      src={`/api/comments/${comment.id}/attachment?view=true`}
                      alt={comment.attachmentName}
                      className="max-w-xs max-h-48 rounded border object-cover hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  </button>
                )}
              </div>
            )}
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
          <div 
            className={`relative ${
              isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Add a comment... (use @ to mention users)"
                value={newComment}
                onChange={(e) => {
                  const value = e.target.value;
                  const position = e.target.selectionStart;
                  setNewComment(value);
                  setCursorPosition(position);
                  
                  // Check for @ mentions
                  const beforeCursor = value.substring(0, position);
                  const mentionMatch = beforeCursor.match(/@(\w*)$/);
                  
                  if (mentionMatch) {
                    setMentionQuery(mentionMatch[1]);
                    setShowMentions(true);
                  } else {
                    setShowMentions(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowMentions(false);
                  }
                }}
                className="min-h-20 resize-none"
                data-testid="input-new-comment"
              />
              
              {showMentions && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {users
                    .filter(user => 
                      user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                      user.email.toLowerCase().includes(mentionQuery.toLowerCase())
                    )
                    .slice(0, 5)
                    .map(user => (
                      <button
                        key={user.id}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => {
                          const beforeCursor = newComment.substring(0, cursorPosition);
                          const afterCursor = newComment.substring(cursorPosition);
                          const beforeMention = beforeCursor.replace(/@\w*$/, '');
                          const newValue = beforeMention + `@${user.name} ` + afterCursor;
                          setNewComment(newValue);
                          setShowMentions(false);
                          textareaRef.current?.focus();
                        }}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-brand-teal text-white text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
            {isDragOver && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-md flex items-center justify-center">
                <p className="text-primary font-medium">Drop image here</p>
              </div>
            )}
          </div>
          
          {selectedFile && (
            <div className="p-2 bg-muted rounded border space-y-2">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1">{selectedFile.name}</span>
                <Button size="sm" variant="ghost" onClick={removeFile} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {selectedFile.type.startsWith('image/') && (
                <div className="mt-2">
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    className="max-w-xs max-h-32 rounded border object-cover"
                  />
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Paperclip className="h-4 w-4" />
                Attach File
              </Button>
            </div>
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
      
      <FilePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        fileName={previewFile?.name || ""}
        fileUrl={previewFile?.url || ""}
        downloadUrl={previewFile?.downloadUrl}
      />
    </div>
  );
}