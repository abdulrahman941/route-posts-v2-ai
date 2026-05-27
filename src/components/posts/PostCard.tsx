"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Heart, MessageCircle, Trash2, Loader2, Send,
  ChevronDown, ChevronUp, MoreHorizontal, Pencil,
  Bookmark, Share2, ThumbsUp,
} from "lucide-react";
import type { Post } from "@/types";
import { formatDate, getPostId, getUserId } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import {
  useUpdatePost,
  useDeletePost,
  useLikePost,
  useBookmarkPost,
} from "@/hooks/usePosts";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useLikeComment,
} from "@/hooks/useComments";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [menuOpen, setMenuOpen] = useState(false);

  const postId = getPostId(post);
  const isOwner = session?.user?.id === getUserId(post.user);

  // ─── Mutations ─────────────────────────────────────────
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const likePost = useLikePost();
  const bookmarkPost = useBookmarkPost();

  // ─── Comments ──────────────────────────────────────────
  const { data: comments = [], isLoading: loadingComments } = useComments(postId, showComments);
  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);
  const likeComment = useLikeComment(postId);

  const handleLike = () => likePost.mutate(postId);
  const handleBookmark = () => bookmarkPost.mutate(postId);

  const handleDeletePost = () => {
    if (!window.confirm("Delete this post?")) return;
    deletePost.mutate(postId);
    setMenuOpen(false);
  };

  const handleUpdatePost = () => {
    if (!editBody.trim()) return;
    updatePost.mutate(
      { postId, body: editBody },
      { onSuccess: () => setEditMode(false) }
    );
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    createComment.mutate(commentText, {
      onSuccess: () => {
        setCommentText("");
        if (!showComments) setShowComments(true);
      },
    });
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar name={post.user?.name} image={post.user?.photo} size="md" />
          <div>
            {/* ✅ user name never "Unknown" — comes from optimistic state */}
            <p className="font-semibold text-sm text-gray-900">
              {post.user?.name || "…"}
            </p>
            <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {isOwner && (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost p-2 text-gray-400">
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-10 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                <button
                  onClick={() => { setEditMode(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pencil size={15} /> Edit post
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={deletePost.isPending}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                >
                  {deletePost.isPending
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Trash2 size={15} />}
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        {editMode ? (
          <div className="space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="input resize-none"
              rows={3}
              disabled={updatePost.isPending}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditMode(false)}
                className="btn-secondary py-1.5 px-3 text-sm"
                disabled={updatePost.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePost}
                className="btn-primary py-1.5 px-3 text-sm"
                disabled={updatePost.isPending || !editBody.trim()}
              >
                {updatePost.isPending
                  ? <Loader2 size={14} className="animate-spin" />
                  : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.body}
          </p>
        )}
      </div>

      {/* Image */}
      {post.image && !editMode && (
        <div className="border-t border-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt="Post" className="w-full max-h-96 object-cover" loading="lazy" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-red-50 ${
            post.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
          }`}
        >
          <Heart size={17} className={post.isLiked ? "fill-red-500" : ""} />
          <span className="text-xs">
            {(post.likesCount ?? post.likeCount ?? 0) > 0
              ? post.likesCount ?? post.likeCount
              : ""}
          </span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition"
        >
          <MessageCircle size={17} />
          <span className="text-xs">
            {post.commentsCount || post.commentCount || comments.length || ""}
          </span>
          {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition hover:bg-yellow-50 ${
            post.isBookmarked ? "text-yellow-500" : "text-gray-500 hover:text-yellow-500"
          }`}
        >
          <Bookmark size={17} className={post.isBookmarked ? "fill-yellow-500" : ""} />
        </button>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-green-500 hover:bg-green-50 transition">
          <Share2 size={17} />
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-gray-50 px-4 py-3 space-y-3">
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-center text-gray-400 py-2">
              No comments yet. Be the first!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const commentId = comment.id || comment._id || "";
                const isCommentOwner =
                  session?.user?.id === getUserId(comment.user);

                return (
                  <div key={commentId} className="flex gap-2">
                    <Avatar
                      name={comment.user?.name}
                      image={comment.user?.photo}
                      size="sm"
                    />
                    <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        {/* ✅ comment user name — always from session when optimistic */}
                        <p className="text-xs font-semibold text-gray-800">
                          {comment.user?.name || "…"}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">
                            {formatDate(comment.createdAt)}
                          </span>
                          <button
                            onClick={() =>
                              likeComment.mutate(commentId)
                            }
                            className={`p-1 transition ${
                              comment.isLiked
                                ? "text-blue-500"
                                : "text-gray-400 hover:text-blue-500"
                            }`}
                          >
                            <ThumbsUp size={11} className={comment.isLiked ? "fill-blue-500" : ""} />
                          </button>
                          {comment.likesCount ? (
                            <span className="text-xs text-gray-400">
                              {comment.likesCount}
                            </span>
                          ) : null}
                          {isCommentOwner && (
                            <button
                              onClick={() => deleteComment.mutate(commentId)}
                              className="p-1 text-gray-400 hover:text-red-500 transition"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 mt-0.5">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add comment */}
          <div className="flex gap-2 pt-1">
            <Avatar
              name={session?.user?.name}
              image={session?.user?.image}
              size="sm"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Write a comment..."
                className="input py-2"
                disabled={createComment.isPending}
              />
              <button
                onClick={handleAddComment}
                disabled={createComment.isPending || !commentText.trim()}
                className="btn-primary py-2 px-3"
              >
                {createComment.isPending
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
