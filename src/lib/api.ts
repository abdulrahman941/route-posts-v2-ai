import axios from "axios";
import type {
  Post, CreatePostPayload, Comment,
  User, SignupPayload, SigninPayload, AuthResponse, Notification, ApiResponse,
} from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://route-posts.routemisr.com";

// ======= Helper =======
function extractData<T>(res: { data: ApiResponse<T> }): T {
  return res.data?.data;
}

function toArray<T>(val: T[] | { posts?: T[]; users?: T[]; comments?: T[]; notifications?: T[] } | null | undefined, key?: string): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (key && (val as Record<string, T[]>)[key]) return (val as Record<string, T[]>)[key];
  // try common keys
  const obj = val as Record<string, T[]>;
  return obj.posts || obj.users || obj.comments || obj.notifications || [];
}

// ======= Auth Client =======
export function createAuthClient(token: string) {
  return axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ======= Auth API =======
export const authApi = {
  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    const res = await axios.post(`${BASE_URL}/users/signup`, payload);
    return res.data;
  },

  signin: async (payload: SigninPayload): Promise<AuthResponse> => {
    const res = await axios.post(`${BASE_URL}/users/signin`, payload);
    return res.data;
  },

  changePassword: async (token: string, payload: { password: string; newPassword: string; newPasswordConfirm: string }): Promise<AuthResponse> => {
    const client = createAuthClient(token);
    const res = await client.patch("/users/change-password", payload);
    return res.data;
  },
};

// ======= Users API =======
export const usersApi = {
  getProfile: async (token: string): Promise<User> => {
    const client = createAuthClient(token);
    const res = await client.get("/users/profile-data");
    const d = extractData<{ user?: User } | User>(res as { data: ApiResponse<{ user?: User } | User> });
    return (d as { user?: User })?.user || (d as User);
  },

  getUserById: async (token: string, userId: string): Promise<User> => {
    const client = createAuthClient(token);
    const res = await client.get(`/users/${userId}/profile`);
    const d = extractData<{ user?: User } | User>(res as { data: ApiResponse<{ user?: User } | User> });
    return (d as { user?: User })?.user || (d as User);
  },

  getSuggestions: async (token: string, page = 1, limit = 10): Promise<User[]> => {
    const client = createAuthClient(token);
    const res = await client.get(`/users/suggestions?page=${page}&limit=${limit}`);
    const d = extractData<User[] | { users?: User[] }>(res as { data: ApiResponse<User[] | { users?: User[] }> });
    return toArray<User>(d as User[] | { users?: User[] });
  },

  followUser: async (token: string, userId: string): Promise<void> => {
    const client = createAuthClient(token);
    await client.post(`/users/${userId}/follow`);
  },

  unfollowUser: async (token: string, userId: string): Promise<void> => {
    const client = createAuthClient(token);
    await client.delete(`/users/${userId}/unfollow`);
  },

  uploadPhoto: async (token: string, file: File): Promise<User> => {
    const client = createAuthClient(token);
    const form = new FormData();
    form.append("photo", file);
    const res = await client.put("/users/upload-photo", form);
    const d = extractData<{ user?: User } | User>(res as { data: ApiResponse<{ user?: User } | User> });
    return (d as { user?: User })?.user || (d as User);
  },

  getUserPosts: async (token: string, userId: string, page = 1, limit = 10): Promise<Post[]> => {
    const client = createAuthClient(token);
    const res = await client.get(`/users/${userId}/posts?page=${page}&limit=${limit}`);
    const d = extractData<Post[] | { posts?: Post[] }>(res as { data: ApiResponse<Post[] | { posts?: Post[] }> });
    return toArray<Post>(d as Post[] | { posts?: Post[] });
  },
};

// ======= Posts API =======
export const postsApi = {
  getAllPosts: async (token: string, page = 1, limit = 10): Promise<Post[]> => {
    const client = createAuthClient(token);
    const res = await client.get(`/posts?page=${page}&limit=${limit}`);
    const d = extractData<Post[] | { posts?: Post[] }>(res as { data: ApiResponse<Post[] | { posts?: Post[] }> });
    return toArray<Post>(d as Post[] | { posts?: Post[] });
  },

  getFeed: async (token: string, page = 1, limit = 10, only?: string): Promise<Post[]> => {
    const client = createAuthClient(token);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (only) params.append("only", only);
    const res = await client.get(`/posts/feed?${params}`);
    const d = extractData<Post[] | { posts?: Post[] }>(res as { data: ApiResponse<Post[] | { posts?: Post[] }> });
    return toArray<Post>(d as Post[] | { posts?: Post[] });
  },

  getPost: async (token: string, postId: string): Promise<Post> => {
    const client = createAuthClient(token);
    const res = await client.get(`/posts/${postId}`);
    const d = extractData<{ post?: Post } | Post>(res as { data: ApiResponse<{ post?: Post } | Post> });
    return (d as { post?: Post })?.post || (d as Post);
  },

  createPost: async (token: string, payload: CreatePostPayload): Promise<Post> => {
    if (payload.image) {
      const form = new FormData();
      form.append("body", payload.body);
      form.append("image", payload.image);
      if (payload.privacy) form.append("privacy", payload.privacy);
      const res = await axios.post(`${BASE_URL}/posts`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = extractData<{ post?: Post } | Post>(res as { data: ApiResponse<{ post?: Post } | Post> });
      return (d as { post?: Post })?.post || (d as Post);
    }
    const client = createAuthClient(token);
    const res = await client.post("/posts", { body: payload.body, privacy: payload.privacy });
    const d = extractData<{ post?: Post } | Post>(res as { data: ApiResponse<{ post?: Post } | Post> });
    return (d as { post?: Post })?.post || (d as Post);
  },

  updatePost: async (token: string, postId: string, payload: Partial<CreatePostPayload>): Promise<Post> => {
    const client = createAuthClient(token);
    const res = await client.put(`/posts/${postId}`, { body: payload.body });
    const d = extractData<{ post?: Post } | Post>(res as { data: ApiResponse<{ post?: Post } | Post> });
    return (d as { post?: Post })?.post || (d as Post);
  },

  deletePost: async (token: string, postId: string): Promise<void> => {
    const client = createAuthClient(token);
    await client.delete(`/posts/${postId}`);
  },

  likePost: async (token: string, postId: string): Promise<void> => {
    const client = createAuthClient(token);
    await client.put(`/posts/${postId}/like`);
  },

  bookmarkPost: async (token: string, postId: string): Promise<void> => {
    const client = createAuthClient(token);
    await client.put(`/posts/${postId}/bookmark`);
  },

  sharePost: async (token: string, postId: string): Promise<Post> => {
    const client = createAuthClient(token);
    const res = await client.post(`/posts/${postId}/share`);
    const d = extractData<{ post?: Post } | Post>(res as { data: ApiResponse<{ post?: Post } | Post> });
    return (d as { post?: Post })?.post || (d as Post);
  },

  getPostLikes: async (token: string, postId: string, page = 1, limit = 10): Promise<User[]> => {
    const client = createAuthClient(token);
    const res = await client.get(`/posts/${postId}/likes?page=${page}&limit=${limit}`);
    const d = extractData<User[] | { users?: User[] }>(res as { data: ApiResponse<User[] | { users?: User[] }> });
    return toArray<User>(d as User[] | { users?: User[] });
  },
};

// ======= Comments API =======
export const commentsApi = {
  getPostComments: async (token: string, postId: string, page = 1, limit = 10): Promise<Comment[]> => {
    const client = createAuthClient(token);
    const res = await client.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`);
    const d = extractData<Comment[] | { comments?: Comment[] }>(res as { data: ApiResponse<Comment[] | { comments?: Comment[] }> });
    return toArray<Comment>(d as Comment[] | { comments?: Comment[] });
  },

  createComment: async (token: string, postId: string, payload: { content: string; image?: File }): Promise<Comment> => {
    const client = createAuthClient(token);
    if (payload.image) {
      const form = new FormData();
      form.append("content", payload.content);
      form.append("image", payload.image);
      const res = await client.post(`/posts/${postId}/comments`, form);
      const d = extractData<{ comment?: Comment } | Comment>(res as { data: ApiResponse<{ comment?: Comment } | Comment> });
      return (d as { comment?: Comment })?.comment || (d as Comment);
    }
    const res = await client.post(`/posts/${postId}/comments`, { content: payload.content });
    const d = extractData<{ comment?: Comment } | Comment>(res as { data: ApiResponse<{ comment?: Comment } | Comment> });
    return (d as { comment?: Comment })?.comment || (d as Comment);
  },

  getReplies: async (token: string, postId: string, commentId: string): Promise<Comment[]> => {
    const client = createAuthClient(token);
    const res = await client.get(`/posts/${postId}/comments/${commentId}/replies`);
    const d = extractData<Comment[] | { comments?: Comment[] }>(res as { data: ApiResponse<Comment[] | { comments?: Comment[] }> });
    return toArray<Comment>(d as Comment[] | { comments?: Comment[] });
  },

  createReply: async (token: string, postId: string, commentId: string, content: string): Promise<Comment> => {
    const client = createAuthClient(token);
    const res = await client.post(`/posts/${postId}/comments/${commentId}/replies`, { content });
    const d = extractData<{ comment?: Comment } | Comment>(res as { data: ApiResponse<{ comment?: Comment } | Comment> });
    return (d as { comment?: Comment })?.comment || (d as Comment);
  },

  updateComment: async (token: string, postId: string, commentId: string, content: string): Promise<Comment> => {
    const client = createAuthClient(token);
    const res = await client.put(`/posts/${postId}/comments/${commentId}`, { content });
    const d = extractData<{ comment?: Comment } | Comment>(res as { data: ApiResponse<{ comment?: Comment } | Comment> });
    return (d as { comment?: Comment })?.comment || (d as Comment);
  },

  deleteComment: async (token: string, postId: string, commentId: string): Promise<void> => {
    const client = createAuthClient(token);
    await client.delete(`/posts/${postId}/comments/${commentId}`);
  },

  likeComment: async (token: string, postId: string, commentId: string): Promise<void> => {
    const client = createAuthClient(token);
    await client.put(`/posts/${postId}/comments/${commentId}/like`);
  },
};

// ======= Notifications API =======
export const notificationsApi = {
  getAll: async (token: string, page = 1, limit = 20): Promise<Notification[]> => {
    const client = createAuthClient(token);
    const res = await client.get(`/notifications?page=${page}&limit=${limit}`);
    const d = extractData<Notification[] | { notifications?: Notification[] }>(res as { data: ApiResponse<Notification[] | { notifications?: Notification[] }> });
    return toArray<Notification>(d as Notification[] | { notifications?: Notification[] });
  },

  getUnreadCount: async (token: string): Promise<number> => {
    const client = createAuthClient(token);
    const res = await client.get("/notifications/unread-count");
    const d = extractData<{ count: number } | number>(res as { data: ApiResponse<{ count: number } | number> });
    return typeof d === "number" ? d : (d as { count: number })?.count || 0;
  },

  markAsRead: async (token: string, notificationId: string): Promise<void> => {
    const client = createAuthClient(token);
    await client.patch(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (token: string): Promise<void> => {
    const client = createAuthClient(token);
    await client.patch("/notifications/read-all");
  },
};
