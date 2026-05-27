import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─── Query Key Factory ─────────────────────────────────────
export const queryKeys = {
  posts: {
    all: ["posts"] as const,
    feed: (page?: number) => ["posts", "feed", page] as const,
    detail: (id: string) => ["posts", id] as const,
    userPosts: (userId: string) => ["posts", "user", userId] as const,
  },
  comments: {
    byPost: (postId: string) => ["comments", postId] as const,
  },
  users: {
    profile: ["users", "profile"] as const,
    suggestions: ["users", "suggestions"] as const,
    detail: (id: string) => ["users", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unread: ["notifications", "unread"] as const,
  },
};
