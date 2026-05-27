"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { Comment } from "@/types";
import { commentsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";

// ─── Fetch comments for a post ─────────────────────────────
export function useComments(postId: string, enabled: boolean) {
  const { data: session } = useSession();
  const token = session?.user?.token ?? "";

  return useQuery({
    queryKey: queryKeys.comments.byPost(postId),
    queryFn: () => commentsApi.getPostComments(token, postId),
    enabled: !!token && !!postId && enabled,
    staleTime: 30_000,
  });
}

// ─── CREATE COMMENT (optimistic) ──────────────────────────
export function useCreateComment(postId: string) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";
  const key = queryKeys.comments.byPost(postId);

  return useMutation({
    mutationFn: (content: string) =>
      commentsApi.createComment(token, postId, { content }),

    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Comment[]>(key);

      // Optimistic comment — user is always from session, never "Unknown"
      const optimistic: Comment = {
        id: `temp-${Date.now()}`,
        content,
        user: {
          id: session?.user?.id ?? "",
          name: session?.user?.name ?? "",
          email: session?.user?.email ?? "",
          photo: session?.user?.image ?? undefined,
        },
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isLiked: false,
      };

      qc.setQueryData<Comment[]>(key, (old) => [...(old ?? []), optimistic]);

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData<Comment[]>(key, ctx?.prev);
      toast.error("Failed to add comment");
    },

    onSuccess: (realComment) => {
      // Replace optimistic temp entry with real data, enrich user if missing
      qc.setQueryData<Comment[]>(key, (old) =>
        (old ?? []).map((c) =>
          c.id.startsWith("temp-")
            ? enrichCommentUser(realComment, session)
            : c
        )
      );
    },
  });
}

// ─── UPDATE COMMENT (optimistic) ──────────────────────────
export function useUpdateComment(postId: string) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";
  const key = queryKeys.comments.byPost(postId);

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentsApi.updateComment(token, postId, commentId, content),

    onMutate: async ({ commentId, content }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Comment[]>(key);

      qc.setQueryData<Comment[]>(key, (old) =>
        (old ?? []).map((c) =>
          (c.id || c._id) === commentId ? { ...c, content } : c
        )
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData<Comment[]>(key, ctx?.prev);
      toast.error("Failed to update comment");
    },

    onSuccess: (updated, { commentId }) => {
      qc.setQueryData<Comment[]>(key, (old) =>
        (old ?? []).map((c) =>
          (c.id || c._id) === commentId
            ? enrichCommentUser({ ...c, ...updated }, session)
            : c
        )
      );
      toast.success("Comment updated");
    },
  });
}

// ─── DELETE COMMENT (optimistic) ──────────────────────────
export function useDeleteComment(postId: string) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";
  const key = queryKeys.comments.byPost(postId);

  return useMutation({
    mutationFn: (commentId: string) =>
      commentsApi.deleteComment(token, postId, commentId),

    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Comment[]>(key);

      qc.setQueryData<Comment[]>(key, (old) =>
        (old ?? []).filter((c) => (c.id || c._id) !== commentId)
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData<Comment[]>(key, ctx?.prev);
      toast.error("Failed to delete comment");
    },

    onSuccess: () => {
      toast.success("Comment deleted");
    },
  });
}

// ─── LIKE COMMENT (optimistic toggle) ─────────────────────
export function useLikeComment(postId: string) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";
  const key = queryKeys.comments.byPost(postId);

  return useMutation({
    mutationFn: (commentId: string) =>
      commentsApi.likeComment(token, postId, commentId),

    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Comment[]>(key);

      qc.setQueryData<Comment[]>(key, (old) =>
        (old ?? []).map((c) => {
          if ((c.id || c._id) !== commentId) return c;
          const liked = !c.isLiked;
          return {
            ...c,
            isLiked: liked,
            likesCount: liked
              ? (c.likesCount ?? 0) + 1
              : Math.max(0, (c.likesCount ?? 0) - 1),
          };
        })
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData<Comment[]>(key, ctx?.prev);
      toast.error("Failed to update like");
    },
  });
}

// ─── Helper ────────────────────────────────────────────────
function enrichCommentUser(
  comment: Comment,
  session: ReturnType<typeof useSession>["data"]
): Comment {
  if (!comment.user?.name) {
    return {
      ...comment,
      user: {
        id: session?.user?.id ?? "",
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        photo: session?.user?.image ?? undefined,
      },
    };
  }
  return comment;
}
