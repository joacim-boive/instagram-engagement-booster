import { Card } from '@/components/ui/card';
import { InstagramPost } from '@/services/instagramService';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type PostCardProps = {
  post: InstagramPost;
  onClick?: () => void;
  isSelected?: boolean;
};

export function PostCard({ post, onClick, isSelected }: PostCardProps) {
  const imageUrl = post.thumbnail_url || post.media_url;
  const commentCount = post.comments.reduce(
    (count, comment) => count + 1 + (comment.replies?.length || 0),
    0
  );

  return (
    <Card
      className={cn(
        'cursor-pointer hover:bg-accent transition-colors',
        isSelected && 'border-primary'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="relative flex-shrink-0 w-24 h-24">
          <Image
            src={imageUrl}
            alt={post.caption || 'Instagram post'}
            fill
            className="object-cover rounded-md"
          />
        </div>
        <div className="flex-grow min-w-0">
          <p className="mb-2 text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
          </p>
          {post.caption && (
            <p className="mb-2 text-sm line-clamp-2">{post.caption}</p>
          )}
          <div className="flex items-center text-muted-foreground">
            <MessageCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{commentCount}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
