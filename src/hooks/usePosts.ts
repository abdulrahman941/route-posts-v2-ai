"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { Post, CreatePostPayload } from "@/types";
import { postsApi, usersApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import { getPostId } from "@/lib/utils";

// ─── Fetch all posts (feed) ────────────────────────────────
export function usePosts() {
  const { data: session } = useSession();
  const token = session?.user?.token ?? "";

  return useQuery({
    queryKey: queryKeys.posts.all,
    queryFn: () => postsApi.getAllPosts(token),
    enabled: !!token,
  });
}

// ─── Fetch user posts ──────────────────────────────────────
export function useUserPosts(userId: string) {
  const { data: session } = useSession();
  const token = session?.user?.token ?? "";

  return useQuery({
    queryKey: queryKeys.posts.userPosts(userId),
    queryFn: () => usersApi.getUserPosts?.(token, userId) ?? Promise.resolve([]),
    enabled: !!token && !!userId,
  });
}

// ─── CREATE POST (optimistic) ──────────────────────────────
export function useCreatePost() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";

  return useMutation({
    mutationFn: (payload: CreatePostPayload) =>
      postsApi.createPost(token, payload),

    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: queryKeys.posts.all });
      const prev = qc.getQueryData<Post[]>(queryKeys.posts.all);

      // Optimistic post with current user's data from session
      const optimistic: Post = {
        id: `temp-${Date.now()}`,
        body: payload.body,
        image: payload.image ? URL.createObjectURL(payload.image) : undefined,
        privacy: payload.privacy,
        user: {
          id: session?.user?.id ?? "",
          name: session?.user?.name ?? "",
          email: session?.user?.email ?? "",
          photo: session?.user?.image ?? undefined,
        },
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date().toISOString(),
      };

      qc.setQueryData<Post[]>(queryKeys.posts.all, (old) =>
        [optimistic, ...(old ?? [])]
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      // Rollback on error
      qc.setQueryData<Post[]>(queryKeys.posts.all, ctx?.prev);
      toast.error("Failed to create post");
    },

    onSuccess: (newPost) => {
      // Replace optimistic with real post (real post may lack user data — inject from session)
      qc.setQueryData<Post[]>(queryKeys.posts.all, (old) =>
        (old ?? []).map((p) =>
          p.id.startsWith("temp-")
            ? enrichPostUser(newPost, session)
            : p
        )
      );
      toast.success("Post created!");
    },
  });
}

// ─── UPDATE POST (optimistic) ──────────────────────────────
export function useUpdatePost() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";

  return useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) =>
      postsApi.updatePost(token, postId, { body }),

    onMutate: async ({ postId, body }) => {
      await qc.cancelQueries({ queryKey: queryKeys.posts.all });
      const prev = qc.getQueryData<Post[]>(queryKeys.posts.all);

      qc.setQueryData<Post[]>(queryKeys.posts.all, (old) =>
        (old ?? []).map((p) =>
          getPostId(p) === postId ? { ...p, body } : p
        )
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData<Post[]>(queryKeys.posts.all, ctx?.prev);
      toast.error("Failed to update post");
    },

    onSuccess: (updated, { postId }) => {
      // Merge real response but keep existing user data if API returned incomplete user
      qc.setQueryData<Post[]>(queryKeys.posts.all, (old) =>
        (old ?? []).map((p) =>
          getPostId(p) === postId
            ? enrichPostUser({ ...p, ...updated }, session)
            : p
        )
      );
      toast.success("Post updated");
    },
  });
}

// ─── DELETE POST (optimistic) ──────────────────────────────
export function useDeletePost() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";

  return useMutation({
    mutationFn: (postId: string) => postsApi.deletePost(token, postId),

    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: queryKeys.posts.all });
      const prev = qc.getQueryData<Post[]>(queryKeys.posts.all);

      qc.setQueryData<Post[]>(queryKeys.posts.all, (old) =>
        (old ?? []).filter((p) => getPostId(p) !== postId)
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData<Post[]>(queryKeys.posts.all, ctx?.prev);
      toast.error("Failed to delete post");
    },

    onSuccess: () => {
      toast.success("Post deleted");
    },
  });
}

// ─── LIKE POST (optimistic toggle) ────────────────────────
export function useLikePost() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";

  return useMutation({
    mutationFn: (postId: string) => postsApi.likePost(token, postId),

    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: queryKeys.posts.all });
      const prev = qc.getQueryData<Post[]>(queryKeys.posts.all);

      qc.setQueryData<Post[]>(queryKeys.posts.all, (old) =>
        (old ?? []).map((p) => {
          if (getPostId(p) !== postId) return p;
          const liked = !p.isLiked;
          const count = p.likesCount ?? p.likeCount ?? 0;
          return {
            ...p,
            isLiked: liked,
            likesCount: liked ? count + 1 : Math.max(0, count - 1),
          };
        })
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData<Post[]>(queryKeys.posts.all, ctx?.prev);
      toast.error("Failed to update like");
    },
  });
}

// ─── BOOKMARK POST (optimistic toggle) ───────────────────
export function useBookmarkPost() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";

  return useMutation({
    mutationFn: (postId: string) => postsApi.bookmarkPost(token, postId),

    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: queryKeys.posts.all });
      const prev = qc.getQueryData<Post[]>(queryKeys.posts.all);

      qc.setQueryData<Post[]>(queryKeys.posts.all, (old) =>
        (old ?? []).map((p) =>
          getPostId(p) === postId
            ? { ...p, isBookmarked: !p.isBookmarked }
            : p
        )
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData<Post[]>(queryKeys.posts.all, ctx?.prev);
      toast.error("Failed to bookmark");
    },

    onSuccess: (_data, postId) => {
      const posts = qc.getQueryData<Post[]>(queryKeys.posts.all);
      const isNowBookmarked = posts?.find((p) => getPostId(p) === postId)?.isBookmarked;
      toast.success(isNowBookmarked ? "Bookmarked!" : "Removed from bookmarks");
    },
  });
}

// ─── Helper: enrich post user data from session ───────────
function enrichPostUser(
  post: Post,
  session: ReturnType<typeof useSession>["data"]
): Post {
  if (!post.user || !post.user.name) {
    return {
      ...post,
      user: {
        id: session?.user?.id ?? "",
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        photo: session?.user?.image ?? undefined,
      },
    };
  }
  return post;
}
