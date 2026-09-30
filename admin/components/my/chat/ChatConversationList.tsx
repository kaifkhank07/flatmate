"use client";

import { ChatConversationItem, ChatParticipant, PaginationMeta } from "@/lib/api";
import { Avatar, Card, Chip } from "@/components/ui";

import Pagination from "@/components/my/ui/Pagination";
import { MessageCircle, RotateCw } from "lucide-react";

const formatTime = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getParticipantName = (p?: ChatParticipant | null) => {
  if (!p) return "Unknown User";
  const name = `${p.firstName || ""}`.trim() ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : "";
  return name || p.email || p.mobile || "User";
};

const getParticipantAvatar = (p?: ChatParticipant | null) => {
  if (p && p.image) return p.image;
  return undefined;
};

export interface ChatConversationListProps {
  conversations: ChatConversationItem[];
  selectedConversation: ChatConversationItem | null;
  loading: boolean;
  onSelectConversation: (conv: ChatConversationItem) => void;
  pagination: PaginationMeta;
  onPageChange: (newPage: number) => void;
}

export default function ChatConversationList({
  conversations,
  selectedConversation,
  loading,
  onSelectConversation,
  pagination,
  onPageChange,
}: ChatConversationListProps) {
  return (
    <Card className="flex-1 flex flex-col p-0 overflow-hidden">
      <div className="p-3.5 border-b border-[var(--hair)] font-bold text-xs text-[var(--ink-3)] uppercase tracking-wider">
        Conversations ({pagination.total || conversations.length})
      </div>

      {/* Conversation Items List */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3 max-h-[520px]">
        {loading ? (
          <div className="py-16 text-center text-[var(--ink-3)] space-y-3">
            <div className="inline-block animate-spin text-[var(--ember)]">
              <RotateCw size={24} />
            </div>
            <p className="text-sm font-medium">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-16 text-center text-[var(--ink-3)] space-y-2">
            <div className="mx-auto text-[var(--ink-4)] mb-2 flex justify-center">
              <MessageCircle size={36} />
            </div>
            <p className="font-semibold text-[var(--ink)]">No conversations found</p>
            <p className="text-xs text-[var(--ink-3)] max-w-xs mx-auto">
              No active chat records exist matching your search or user criteria.
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = selectedConversation?._id === conv._id;
            const p1 = conv.participants[0];
            const p2 = conv.participants[1];
            const lastMsg = conv.lastMessage;

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border ${isSelected
                  ? "bg-[var(--ember-soft)] border-[var(--ember)] shadow-sm"
                  : "bg-[var(--card-2)] border-[var(--hair)] hover:bg-[var(--canvas-2)] hover:border-[var(--hair-2)]"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Dual Avatar Stack */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar
                        name={getParticipantName(p1)}
                        src={getParticipantAvatar(p1)}
                        size={36}
                        ring={isSelected}
                      />
                      <div className="absolute -bottom-1 -right-1">
                        <Avatar
                          name={getParticipantName(p2)}
                          src={getParticipantAvatar(p2)}
                          size={24}
                          ring
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 font-semibold text-xs text-[var(--ink)] truncate">
                        <span className="truncate">{getParticipantName(p1)}</span>
                        <span className="text-[var(--ember)] font-bold text-[11px]">&</span>
                        <span className="truncate">{getParticipantName(p2)}</span>
                      </div>

                      <p className="text-xs text-[var(--ink-3)] truncate mt-0.5">
                        {lastMsg
                          ? lastMsg.isDeleted
                            ? "Message deleted"
                            : lastMsg.text || `[${lastMsg.type}]`
                          : "No messages yet"}
                      </p>
                    </div>
                  </div>

                  {/* Timestamp & Unread Badge */}
                  <div className="flex flex-col items-end flex-shrink-0 gap-1.5">
                    <span className="text-[10.5px] text-[var(--ink-4)] font-mono">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                    {(conv.unreadCount || 0) > 0 && (
                      <Chip tone="rose" dot pulse>
                        {conv.unreadCount} unread
                      </Chip>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Shared Pagination Component */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </Card>
  );
}
