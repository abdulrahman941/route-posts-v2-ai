"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { User } from "@/types";
import { usersApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";

// ─── Fetch current user profile ────────────────────────────
export function useProfile() {
  const { data: session } = useSession();
  const token = session?.user?.token ?? "";

  return useQuery({
    queryKey: queryKeys.users.profile,
    queryFn: () => usersApi.getProfile(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

// ─── Fetch user by ID ──────────────────────────────────────
export function useUserById(userId: string) {
  const { data: session } = useSession();
  const token = session?.user?.token ?? "";

  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => usersApi.getUserById(token, userId),
    enabled: !!token && !!userId,
  });
}

// ─── Fetch suggestions ─────────────────────────────────────
export function useSuggestions() {
  const { data: session } = useSession();
  const token = session?.user?.token ?? "";

  return useQuery({
    queryKey: queryKeys.users.suggestions,
    queryFn: () => usersApi.getSuggestions(token),
    enabled: !!token,
  });
}

// ─── FOLLOW USER (optimistic) ──────────────────────────────
export function useFollowUser() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";

  return useMutation({
    mutationFn: (userId: string) => usersApi.followUser(token, userId),

    onMutate: async (userId) => {
      const suggestionsKey = queryKeys.users.suggestions;
      const detailKey = queryKeys.users.detail(userId);

      await qc.cancelQueries({ queryKey: suggestionsKey });
      await qc.cancelQueries({ queryKey: detailKey });

      const prevSuggestions = qc.getQueryData<User[]>(suggestionsKey);
      const prevDetail = qc.getQueryData<User>(detailKey);

      // Optimistic: mark as following in suggestions list
      qc.setQueryData<User[]>(suggestionsKey, (old) =>
        (old ?? []).map((u) =>
          (u.id || u._id) === userId
            ? {
                ...u,
                isFollowing: true,
                followersCount: (u.followersCount ?? 0) + 1,
              }
            : u
        )
      );

      // Optimistic: mark as following in detail view
      if (prevDetail) {
        qc.setQueryData<User>(detailKey, {
          ...prevDetail,
          isFollowing: true,
          followersCount: (prevDetail.followersCount ?? 0) + 1,
        });
      }

      return { prevSuggestions, prevDetail };
    },

    onError: (_err, userId, ctx) => {
      qc.setQueryData(queryKeys.users.suggestions, ctx?.prevSuggestions);
      qc.setQueryData(queryKeys.users.detail(userId), ctx?.prevDetail);
      toast.error("Failed to follow user");
    },

    onSuccess: () => {
      toast.success("Following!");
    },
  });
}

// ─── UNFOLLOW USER (optimistic) ───────────────────────────
export function useUnfollowUser() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";

  return useMutation({
    mutationFn: (userId: string) => usersApi.unfollowUser(token, userId),

    onMutate: async (userId) => {
      const suggestionsKey = queryKeys.users.suggestions;
      const detailKey = queryKeys.users.detail(userId);

      await qc.cancelQueries({ queryKey: suggestionsKey });
      await qc.cancelQueries({ queryKey: detailKey });

      const prevSuggestions = qc.getQueryData<User[]>(suggestionsKey);
      const prevDetail = qc.getQueryData<User>(detailKey);

      qc.setQueryData<User[]>(suggestionsKey, (old) =>
        (old ?? []).map((u) =>
          (u.id || u._id) === userId
            ? {
                ...u,
                isFollowing: false,
                followersCount: Math.max(0, (u.followersCount ?? 0) - 1),
              }
            : u
        )
      );

      if (prevDetail) {
        qc.setQueryData<User>(detailKey, {
          ...prevDetail,
          isFollowing: false,
          followersCount: Math.max(0, (prevDetail.followersCount ?? 0) - 1),
        });
      }

      return { prevSuggestions, prevDetail };
    },

    onError: (_err, userId, ctx) => {
      qc.setQueryData(queryKeys.users.suggestions, ctx?.prevSuggestions);
      qc.setQueryData(queryKeys.users.detail(userId), ctx?.prevDetail);
      toast.error("Failed to unfollow user");
    },

    onSuccess: () => {
      toast.success("Unfollowed");
    },
  });
}

// ─── UPLOAD PHOTO (invalidate profile after) ──────────────
export function useUploadPhoto() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const token = session?.user?.token ?? "";

  return useMutation({
    mutationFn: (file: File) => usersApi.uploadPhoto(token, file),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.profile });
      toast.success("Photo updated!");
    },

    onError: () => {
      toast.error("Failed to upload photo");
    },
  });
}
