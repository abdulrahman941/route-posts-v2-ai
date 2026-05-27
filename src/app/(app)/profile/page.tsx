"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Camera, FileText, Lock } from "lucide-react";
import toast from "react-hot-toast";
import type { Post, User } from "@/types";
import { usersApi } from "@/lib/api";
import { getPostId } from "@/lib/utils";
import PostCard from "@/components/posts/PostCard";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ password: "", newPassword: "", newPasswordConfirm: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!session?.user?.token || !session?.user?.id) return;
    setLoading(true);
    try {
      const [userData, postsData] = await Promise.all([
        usersApi.getProfile(session.user.token),
        usersApi.getUserPosts(session.user.token, session.user.id),
      ]);
      setProfile(userData);
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.token, session?.user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.token) return;
    setUploading(true);
    try {
      const updated = await usersApi.uploadPhoto(session.user.token, file);
      setProfile(updated);
      await update({ image: updated.photo });
      toast.success("Photo updated!");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!session?.user?.token) return;
    if (pwForm.newPassword !== pwForm.newPasswordConfirm) {
      toast.error("Passwords don't match");
      return;
    }
    setChangingPassword(true);
    try {
      const { authApi } = await import("@/lib/api");
      await authApi.changePassword(session.user.token, pwForm);
      toast.success("Password changed!");
      setPwForm({ password: "", newPassword: "", newPasswordConfirm: "" });
    } catch {
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div className="py-20"><Spinner size={32} label="Loading profile..." /></div>;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={profile?.name || session?.user?.name} image={profile?.photo || session?.user?.image} size="xl" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-1.5 text-white shadow hover:bg-blue-700 transition"
            >
              <Camera size={12} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile?.name || session?.user?.name}</h1>
            <p className="text-sm text-gray-500">{profile?.email || session?.user?.email}</p>
            {profile?.gender && <p className="text-xs text-gray-400 mt-1 capitalize">{profile.gender}</p>}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Lock size={16} /> Change Password</h2>
        <div className="space-y-3">
          <input type="password" placeholder="Current password" className="input" value={pwForm.password} onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })} />
          <input type="password" placeholder="New password" className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          <input type="password" placeholder="Confirm new password" className="input" value={pwForm.newPasswordConfirm} onChange={(e) => setPwForm({ ...pwForm, newPasswordConfirm: e.target.value })} />
          <button onClick={handleChangePassword} disabled={changingPassword || !pwForm.password || !pwForm.newPassword} className="btn-primary w-full">
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>

      {/* My Posts */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">My Posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <EmptyState icon={FileText} title="No posts yet" description="Create your first post!" />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={getPostId(post)} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
