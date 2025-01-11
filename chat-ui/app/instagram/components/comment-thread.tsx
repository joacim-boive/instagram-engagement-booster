import { InstagramComment } from '@/services/instagramService';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type CommentThreadProps = {
  comments: InstagramComment[];
  className?: string;
};

function Comment({ comment }: { comment: InstagramComment }) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          'p-3 rounded-lg',
          comment.isFromPage
            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100'
            : 'bg-muted'
        )}
      >
        <div className="flex justify-between items-start gap-2">
          <span className="font-medium text-sm">{comment.username}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.timestamp), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="mt-1 text-sm whitespace-pre-wrap">{comment.text}</p>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 space-y-2">
          {comment.replies.map(reply => (
            <Comment key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentThread({ comments, className }: CommentThreadProps) {
  // Sort comments by timestamp
  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className={cn('space-y-4', className)}>
      {sortedComments.map(comment => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
