'use client';

import { useState, useEffect } from 'react';
import { PostList } from './post-list';
import { CommentThread } from './comment-thread';
import {
  InstagramService,
  type InstagramPost,
} from '@/services/instagramService';
import { ConfigService } from '@/services/configService';

export function InstagramPanel() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPosts() {
      try {
        const config = await ConfigService.getInstagramConfig();
        if (!config) {
          setError('Please configure your Instagram credentials');
          return;
        }

        const instagram = new InstagramService(
          config.accessToken,
          config.pageId
        );
        const fetchedPosts = await instagram.getRecentPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching Instagram posts:', error);
        setError('Failed to load Instagram posts');
      } finally {
        setIsLoading(false);
      }
    }

    loadPosts();
  }, []);

  return (
    <div className="h-full p-4">
      {isLoading ? (
        <p className="text-muted-foreground">Loading posts...</p>
      ) : error ? (
        <p className="text-muted-foreground">{error}</p>
      ) : posts.length > 0 ? (
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
      ) : (
        <p className="text-muted-foreground">No posts found</p>
      )}
    </div>
  );
}
