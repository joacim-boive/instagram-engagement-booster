'use client';

import { PostListColumn } from '../comments/components/post-list-column';
import { InstagramPost, PaginatedPosts } from '@/services/instagramService';

export type PostListProps = {
  initialData: PaginatedPosts;
  selectedPostId?: string;
  onSelectPost: (post: InstagramPost) => void;
  isLoading?: boolean;
  onLoadMore: (cursor: string) => Promise<void>;
  onSearch: (query: string) => void;
};

export function PostList({
  initialData,
  selectedPostId,
  onSelectPost,
  isLoading,
  onLoadMore,
  onSearch,
}: PostListProps) {
  return (
    <PostListColumn
      initialData={initialData}
      selectedPostId={selectedPostId}
      onSelectPost={onSelectPost}
      isLoading={isLoading}
      onLoadMore={onLoadMore}
      onSearch={onSearch}
    />
  );
}
