import { ScrollArea } from '@/components/ui/scroll-area';
import { InstagramPost } from '@/services/instagramService';
import { PostCard } from './post-card';

type PostListProps = {
  posts: InstagramPost[];
  onSelectPost?: (post: InstagramPost) => void;
  selectedPostId?: string;
};

export function PostList({
  posts,
  onSelectPost,
  selectedPostId,
}: PostListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onClick={() => onSelectPost?.(post)}
            isSelected={post.id === selectedPostId}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
