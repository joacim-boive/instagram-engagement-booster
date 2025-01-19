import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { InstagramComment } from '@/services/instagramService';

export type CommentThreadProps = {
  comments: InstagramComment[];
  selectedCommentId?: string;
  onSelectComment?: (comment: InstagramComment) => void;
};

export function CommentThread({
  comments,
  selectedCommentId,
  onSelectComment,
}: CommentThreadProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: comments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[calc(100vh-20rem)] overflow-y-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const comment = comments[virtualRow.index];
          return (
            <div
              key={comment.id}
              className={`absolute top-0 left-0 w-full p-4 ${
                selectedCommentId === comment.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${onSelectComment ? 'cursor-pointer' : ''} border rounded-lg`}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onClick={() => onSelectComment?.(comment)}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="font-medium">{comment.username}</p>
                  <p className="text-muted-foreground">{comment.text}</p>
                  {comment.timestamp && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(comment.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
