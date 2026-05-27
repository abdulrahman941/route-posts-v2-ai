"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Bell, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import type { Notification } from "@/types";
import { notificationsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.token) return;
    setLoading(true);
    try {
      const data = await notificationsApi.getAll(session.user.token);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.token]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    if (!session?.user?.token) return;
    try {
      await notificationsApi.markAllAsRead(session.user.token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark notifications");
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!session?.user?.token) return;
    try {
      await notificationsApi.markAsRead(session.user.token, id);
      setNotifications((prev) => prev.map((n) => (n.id === id || n._id === id) ? { ...n, isRead: true } : n));
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return <div className="py-20"><Spinner size={32} label="Loading notifications..." /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Notifications {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">{unreadCount}</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-ghost text-sm gap-1.5">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="card divide-y divide-gray-50 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id || n._id}
              onClick={() => !n.isRead && handleMarkRead(n.id || n._id || "")}
              className={`flex items-start gap-3 p-4 transition cursor-pointer hover:bg-gray-50 ${!n.isRead ? "bg-blue-50/50" : ""}`}
            >
              <Avatar name={n.sender?.name} image={n.sender?.photo} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.createdAt)}</p>
              </div>
              {!n.isRead && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
