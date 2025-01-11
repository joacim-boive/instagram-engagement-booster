'use client';

import { useState } from 'react';
import { PostList } from './post-list';
import { CommentThread } from './comment-thread';
import {
  InstagramService,
  type InstagramPost,
} from '@/services/instagramService';
import { ConfigService } from '@/services/configService';
import { useQuery } from '@tanstack/react-query';

export function InstagramPanel() {
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);

  const {
    data: posts,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['instagram-posts'],
    queryFn: async () => {
      const config = await ConfigService.getInstagramConfig();
      if (!config) {
        throw new Error('Please configure your Instagram credentials');
      }

      const instagram = new InstagramService(config.accessToken, config.pageId);
      return instagram.getRecentPosts();
    },
    staleTime: Infinity, // Keep the data forever until manually invalidated
    retry: false, // Don't retry on error
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading posts...</p>;
  }

  if (error) {
    return (
      <p className="text-muted-foreground">
        {error instanceof Error
          ? error.message
          : 'Failed to load Instagram posts'}
      </p>
    );
  }

  if (!posts?.length) {
    return <p className="text-muted-foreground">No posts found</p>;
  }

  return (
    <div className="space-y-4">
      <PostList
        posts={posts}
        selectedPostId={selectedPost?.id}
        onSelectPost={setSelectedPost}
      />
      {selectedPost && (
        <div className="mt-4">
          <CommentThread comments={selectedPost.comments} />
        </div>
      )}
    </div>
  );
}
