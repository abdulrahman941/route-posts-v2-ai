"use client";

import { FileText, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePosts } from "@/hooks/usePosts";
import { queryKeys } from "@/lib/queryClient";
import { getPostId } from "@/lib/utils";
import PostCard from "@/components/posts/PostCard";
import CreatePost from "@/components/posts/CreatePost";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

export default function FeedPage() {
  const qc = useQueryClient();
  const { data: posts = [], isLoading, isFetching } = usePosts();

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: queryKeys.posts.all });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Your Feed</h1>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="btn-ghost text-gray-500 gap-1.5 text-sm"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <CreatePost />

      {isLoading ? (
        <div className="py-20">
          <Spinner size={32} label="Loading posts..." />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No posts yet"
          description="Be the first to share something!"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={getPostId(post)} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
