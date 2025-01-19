'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useEffect, useMemo, useState } from 'react';
import { InstagramPost, PaginatedPosts } from '@/services/instagramService';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface PostListColumnProps {
  initialData: PaginatedPosts;
  selectedPostId?: string;
  onSelectPost: (post: InstagramPost) => void;
  isLoading?: boolean;
  onLoadMore: (cursor: string) => Promise<void>;
  onSearch: (query: string) => void;
}

export function PostListColumn({
  initialData,
  selectedPostId,
  onSelectPost,
  isLoading,
  onLoadMore,
  onSearch,
}: PostListColumnProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return initialData.posts;

    return initialData.posts.filter(
      post =>
        post.caption?.toLowerCase().includes(query) || post.id.includes(query)
    );
  }, [initialData.posts, searchQuery]);

  const shouldShowLoader = !searchQuery && initialData.hasNextPage;

  const rowVirtualizer = useVirtualizer({
    count: filteredPosts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // Set up intersection observer for infinite loading
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement || !shouldShowLoader || isLoading) {
      console.log('Skipping observer setup:', {
        hasElement: !!loadMoreElement,
        shouldShowLoader,
        isLoading,
      });
      return;
    }

    console.log('Setting up intersection observer');
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        console.log('Intersection:', {
          isIntersecting: entry.isIntersecting,
          hasCursor: !!initialData.nextCursor,
          cursor: initialData.nextCursor,
        });

        if (entry.isIntersecting && initialData.nextCursor) {
          console.log(
            'Loading more posts with cursor:',
            initialData.nextCursor
          );
          onLoadMore(initialData.nextCursor);
        }
      },
      {
        root: parentRef.current,
        threshold: 0.1,
        rootMargin: '500px',
      }
    );

    observer.observe(loadMoreElement);
    return () => {
      console.log('Cleaning up observer');
      observer.disconnect();
    };
  }, [shouldShowLoader, initialData.nextCursor, isLoading, onLoadMore]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] border-r">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            placeholder="Filter posts..."
            className="pl-9"
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const post = filteredPosts[virtualRow.index];
            return (
              <div
                key={post.id}
                className={cn(
                  'absolute top-0 left-0 w-full p-3 cursor-pointer hover:bg-accent/50 border-b',
                  selectedPostId === post.id && 'bg-accent'
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onSelectPost(post)}
              >
                <div className="flex gap-3">
                  <Image
                    src={post.thumbnail_url || post.media_url}
                    alt={post.caption || 'Instagram post'}
                    width={64}
                    height={64}
                    className="object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-muted-foreground">
                      {post.caption
                        ? post.caption.slice(0, 50) +
                          (post.caption.length > 50 ? '...' : '')
                        : 'No caption'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(post.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {shouldShowLoader && (
          <div
            ref={loadMoreRef}
            className="py-8 text-center text-muted-foreground"
          >
            {isLoading && (
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
