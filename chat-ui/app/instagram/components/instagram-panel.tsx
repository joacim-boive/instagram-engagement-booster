'use client';

import { useState } from 'react';
import { PostList } from './post-list';
import { CommentThread } from './comment-thread';
import {
  InstagramService,
  type InstagramPost,
} from '@/services/instagramService';
import { useQuery } from '@tanstack/react-query';

export function InstagramPanel() {
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['instagram-posts'],
    queryFn: () => InstagramService.getConfigAndPosts(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });
  //TODO staleTime should be a user setting
  //TODO gcTime should be a user setting

  return (
    <div className="h-full p-4">
      {isLoading ? (
        <p className="text-muted-foreground">Loading posts...</p>
      ) : error || data?.error ? (
        <p className="text-muted-foreground">
          {data?.error || 'An error occurred'}
        </p>
      ) : data?.posts.length ? (
        <div className="space-y-4">
          <PostList
            initialData={{
              posts: data.posts,
              hasNextPage: false,
              nextCursor: undefined,
            }}
            selectedPostId={selectedPost?.id}
            onSelectPost={setSelectedPost}
            isLoading={false}
            onLoadMore={() => Promise.resolve()}
            onSearch={() => {}}
          />
          {selectedPost && (
            <div className="mt-4">
              <CommentThread comments={selectedPost.comments} />
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">No posts found</p>
      )}
    </div>
  );
}
