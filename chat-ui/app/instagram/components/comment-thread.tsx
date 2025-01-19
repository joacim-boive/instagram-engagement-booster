import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { InstagramComment } from '@/services/instagramService';
import { cn } from '@/lib/utils';
import { FormattedDate } from '@/components/ui/formatted-date';

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
    estimateSize: () => 100,
    overscan: 5,
    measureElement: element => {
      return element.getBoundingClientRect().height;
    },
  });

  return (
    <div ref={parentRef} className="h-[calc(100vh-12rem)] overflow-y-auto">
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
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className={cn(
                'absolute top-0 left-0 w-full py-2 px-3 cursor-pointer border-b transition-colors duration-200 ease-in-out group',
                'hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:border-blue-800',
                selectedCommentId === comment.id
                  ? 'bg-blue-100 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800'
                  : 'hover:shadow-sm'
              )}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onClick={() => onSelectComment?.(comment)}
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {comment.username}
                </p>
                <p className="text-sm text-muted-foreground">{comment.text}</p>
                {comment.timestamp && (
                  <p className="text-xs text-muted-foreground">
                    <FormattedDate date={new Date(comment.timestamp)} />
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
