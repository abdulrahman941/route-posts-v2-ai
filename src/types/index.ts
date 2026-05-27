// ========= Auth =========
export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
}

export interface SigninPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

// ========= User =========
export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  photo?: string;
  coverPhoto?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  createdAt?: string;
  updatedAt?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
}

// ========= Post =========
export interface Post {
  id: string;
  _id?: string;
  body: string;
  image?: string;
  privacy?: "public" | "private" | "friends";
  user?: User;
  likesCount?: number;
  likeCount?: number;
  commentsCount?: number;
  commentCount?: number;
  sharesCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt?: string;
  updatedAt?: string;
  originalPost?: Post;
}

export interface CreatePostPayload {
  body: string;
  image?: File;
  privacy?: "public" | "private" | "friends";
}

// ========= Comment =========
export interface Comment {
  id: string;
  _id?: string;
  content: string;
  image?: string;
  user?: User;
  post?: string;
  likesCount?: number;
  isLiked?: boolean;
  createdAt?: string;
  repliesCount?: number;
}

export interface CreateCommentPayload {
  content: string;
  post: string;
  image?: File;
}

// ========= Notification =========
export interface Notification {
  id: string;
  _id?: string;
  type: string;
  message: string;
  isRead: boolean;
  sender?: User;
  post?: Post;
  createdAt?: string;
}

// ========= API Response =========
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ========= NextAuth =========
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    token: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      token: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    token: string;
    image?: string;
    name?: string;
  }
}
