'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PostList } from '../../components/post-list';
import { CommentThread } from '../../components/comment-thread';
import {
  InstagramService,
  type InstagramPost,
  type InstagramComment,
  type PaginatedPosts,
} from '@/services/instagramService';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDismiss } from '@/hooks/use-dismiss';

export function CommentResponsePanel() {
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [selectedComment, setSelectedComment] =
    useState<InstagramComment | null>(null);
  const [response, setResponse] = useState('');

  const { data, isLoading, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery<PaginatedPosts>({
      queryKey: ['instagram-posts'],
      queryFn: async ({ pageParam }) => {
        return InstagramService.getConfigAndPosts(25, pageParam as string);
      },
      getNextPageParam: lastPage => lastPage.nextCursor,
      initialPageParam: null as string | null,
      staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    });
  //TODO staleTime should be a user setting

  const handleSearch = useDebouncedCallback(() => {
    // Client-side search is handled in PostListColumn
  }, 100);

  const handleLoadMore = async (cursor: string) => {
    console.log('Loading more posts with cursor:', cursor);
    await fetchNextPage();
  };

  const handleSubmitResponse = async () => {
    if (!selectedPost || !selectedComment || !response.trim()) return;

    try {
      await InstagramService.reply(
        selectedPost.id,
        selectedComment.id,
        response
      );
      setResponse('');
      setSelectedComment(null);
    } catch (error) {
      console.error('Failed to post response:', error);
    }
  };

  // Combine all posts from all pages
  const allPosts = data?.pages.flatMap(page => page.posts) ?? [];
  const currentError = data?.pages[0]?.error;
  const lastPage = data?.pages[data.pages.length - 1];

  const responseRef = useDismiss({
    onDismiss: () => setSelectedComment(null),
    enabled: !!selectedComment,
  });

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Select Post</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading posts...</p>
        ) : currentError ? (
          <p className="text-destructive">{currentError}</p>
        ) : allPosts.length ? (
          <PostList
            initialData={{
              posts: allPosts,
              hasNextPage: !!hasNextPage,
              nextCursor: lastPage?.nextCursor,
            }}
            selectedPostId={selectedPost?.id}
            onSelectPost={post => {
              setSelectedPost(post);
              setSelectedComment(null);
            }}
            isLoading={isFetchingNextPage}
            onLoadMore={handleLoadMore}
            onSearch={handleSearch}
          />
        ) : (
          <p className="text-muted-foreground">No posts found</p>
        )}
      </div>

      {selectedPost && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select Comment</h2>
          <CommentThread
            comments={selectedPost.comments}
            selectedCommentId={selectedComment?.id}
            onSelectComment={setSelectedComment}
          />
        </div>
      )}

      <div
        ref={responseRef}
        className={cn(
          'transform transition-transform duration-300 ease-in-out bg-muted border-t md:fixed md:inset-x-0 md:bottom-0 md:pl-20 drop-shadow-[0_-4px_3px_rgb(0,0,0,0.07)]',
          selectedComment ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="container max-w-4xl p-4 ml-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Response</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedComment(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {selectedComment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">Replying to:</p>
                <p className="text-muted-foreground">{selectedComment.text}</p>
              </div>
              <Textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Type your response..."
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!response.trim()}
                >
                  Post Response
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
