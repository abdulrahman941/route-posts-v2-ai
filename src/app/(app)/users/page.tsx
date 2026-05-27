"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Users } from "lucide-react";
import toast from "react-hot-toast";
import type { User } from "@/types";
import { usersApi } from "@/lib/api";
import { getUserId } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    if (!session?.user?.token) return;
    setLoading(true);
    try {
      const data = await usersApi.getSuggestions(session.user.token);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.token]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const handleFollow = async (userId: string) => {
    if (!session?.user?.token) return;
    const isFollowing = following.has(userId);
    try {
      if (isFollowing) {
        await usersApi.unfollowUser(session.user.token, userId);
        setFollowing((prev) => { const s = new Set(prev); s.delete(userId); return s; });
        toast.success("Unfollowed");
      } else {
        await usersApi.followUser(session.user.token, userId);
        setFollowing((prev) => new Set([...prev, userId]));
        toast.success("Following!");
      }
    } catch {
      toast.error("Failed to update follow");
    }
  };

  if (loading) return <div className="py-20"><Spinner size={32} label="Loading people..." /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">People You May Know</h1>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No suggestions" description="Check back later!" />
      ) : (
        <div className="card divide-y divide-gray-50 overflow-hidden">
          {users.map((user) => {
            const uid = getUserId(user);
            const isFollowing = following.has(uid) || user.isFollowing;
            return (
              <div key={uid} className="flex items-center gap-3 p-4">
                <Avatar name={user.name} image={user.photo} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => handleFollow(uid)}
                  className={isFollowing ? "btn-secondary text-xs py-1.5 px-3" : "btn-primary text-xs py-1.5 px-3"}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
