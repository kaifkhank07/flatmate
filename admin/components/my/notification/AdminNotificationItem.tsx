"use client";

import { useState } from "react";
import Link from "next/link";
import {
  INotificationItem,
  ADMIN_NOTIFICATION_CATEGORIES_META,
  NotificationPriority,
} from "@/types/notification.types";
import { Chip } from "@/components/ui";
import Icon from "@/components/icons";
import {
  Check,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Clock,
  Mail,
  Smartphone,
  MessageSquare,
  Bell,
  CheckCheck,
} from "lucide-react";
import DeleteNotificationDialog from "./DeleteNotificationDialog";

interface AdminNotificationItemProps {
  notification: INotificationItem;
  onMarkAsRead: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export default function AdminNotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: AdminNotificationItemProps) {
  const [isActing, setIsActing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const categoryMeta =
    ADMIN_NOTIFICATION_CATEGORIES_META[notification.category] || {
      label: notification.category,
      colorTone: "iris",
      icon: "bell",
    };

  const getPriorityChipTone = (priority: NotificationPriority) => {
    switch (priority) {
      case "URGENT":
        return "rose";
      case "HIGH":
        return "amber";
      case "LOW":
        return "sand";
      case "NORMAL":
      default:
        return "iris";
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleMarkRead = async () => {
    if (notification.isRead || isActing) return;
    setIsActing(true);
    await onMarkAsRead(notification._id);
    setIsActing(false);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const success = await onDelete(notification._id);
      if (success) {
        setShowDeleteDialog(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col sm:flex-row items-start justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
        !notification.isRead
          ? "bg-[var(--card)] border-[var(--hair)] shadow-sm ring-1 ring-blue-500/10"
          : "bg-[var(--card)] border-[var(--hair)] opacity-90 hover:opacity-100"
      }`}
    >
      {/* Unread Accent Bar on Left */}
      {!notification.isRead && (
        <span
          className="absolute left-0 top-3 bottom-3 w-1 bg-[var(--ember)] rounded-r-md"
          title="Unread notification"
        />
      )}

      {/* Main Content Area */}
      <div className="flex items-start gap-3.5 sm:gap-4 flex-1 pl-2 sm:pl-1">
        {/* Category Icon Badge */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            !notification.isRead
              ? "bg-[var(--ember)] text-white"
              : "bg-[var(--canvas-2)] text-[var(--ink-2)]"
          }`}
        >
          <Icon name={categoryMeta.icon} size={18} />
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 pr-2">
          {/* Metadata Badges & Timestamp */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Chip tone={categoryMeta.colorTone as any}>
              {categoryMeta.label}
            </Chip>

            {/* {notification.priority !== "NORMAL" && (
              <Chip tone={getPriorityChipTone(notification.priority)} pulse={notification.priority === "URGENT"}>
                {notification.priority}
              </Chip>
            )} */}

            <div className="flex items-center gap-1 text-[11px] text-[var(--ink-4)] ml-auto sm:ml-0 font-medium">
              <Clock size={12} />
              <span>{formatTimeAgo(notification.createdAt)}</span>
            </div>
          </div>

          {/* Title & Message */}
          <h4
            className={`text-sm sm:text-base font-semibold leading-snug ${
              !notification.isRead ? "text-[var(--ink-1)]" : "text-[var(--ink-2)]"
            }`}
          >
            {notification.title}
          </h4>

          <p className="text-xs sm:text-sm text-[var(--ink-3)] mt-1 leading-relaxed break-words">
            {notification.message}
          </p>

          {/* Action Button & Channel Delivery Indicators */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {notification.actionUrl && (
              <Link
                href={notification.actionUrl}
                onClick={handleMarkRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--canvas-2)] hover:bg-[var(--canvas)] text-[var(--ink-1)] border border-[var(--hair)] transition active:scale-95"
              >
                <span>View Details</span>
                <ExternalLink size={12} />
              </Link>
            )}

            {/* Delivery Channel Badges */}
            {/* {notification.channels && notification.channels.length > 0 && (
              <div className="flex items-center gap-1.5">
                {notification.channels.map((ch) => {
                  if (ch.status === "SKIPPED") return null;
                  return (
                    <span
                      key={ch.channel}
                      title={`${ch.channel}: ${ch.status}`}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                        ch.status === "SENT" || ch.status === "DELIVERED" || ch.status === "READ"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : ch.status === "FAILED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {ch.channel === "IN_APP" && <Bell size={10} className="mr-0.5" />}
                      {ch.channel === "EMAIL" && <Mail size={10} className="mr-0.5" />}
                      {ch.channel === "SMS" && <Smartphone size={10} className="mr-0.5" />}
                      {ch.channel === "WHATSAPP" && <MessageSquare size={10} className="mr-0.5" />}
                      {ch.channel.toLowerCase()}
                    </span>
                  );
                })}
              </div>
            )} */}
          </div>
        </div>
      </div>

      {/* Item Action Buttons */}
      <div className="flex sm:flex-col items-center justify-end gap-1.5 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--hair)] w-full sm:w-auto shrink-0">
        {!notification.isRead && (
          <button
            type="button"
            onClick={handleMarkRead}
            disabled={isActing}
            title="Mark as read"
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-[var(--ink-2)] hover:text-emerald-600 hover:bg-emerald-50/50 transition cursor-pointer disabled:opacity-50"
          >
            <Check size={14} />
            <span className="sm:hidden">Mark read</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
          title="Delete notification"
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-[var(--ink-3)] hover:text-rose-600 hover:bg-rose-50/50 transition cursor-pointer disabled:opacity-50 ml-auto sm:ml-0"
        >
          <Trash2 size={14} />
          <span className="sm:hidden">Delete</span>
        </button>
      </div>

      <DeleteNotificationDialog
        isOpen={showDeleteDialog}
        notificationTitle={notification.title}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) setShowDeleteDialog(false);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
