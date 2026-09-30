"use client";

import { useEffect, useState, useCallback } from "react";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import {
  fetchChatConversations,
  fetchChatMessages,
  ChatConversationItem,
  ChatMessageItem,
  PaginationMeta,
  UserItem,
} from "@/lib/api";

import PageHead from "../ui/PageHead";
import ChatUserSelectFilter from "./ChatUserSelectFilter";
import ChatConversationList from "./ChatConversationList";
import ChatMessageViewer from "./ChatMessageViewer";
import { RotateCw } from "lucide-react";

const LIMIT = 10;

export default function ChatManager({
  eyebrow = "User Management",
  title = "Chat Management",
  sub = "Monitor user-to-user real-time chat conversations, message logs, and shared content.",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
}) {
  usePageMotion();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });

  // Search & User Filter States
  const [search, setSearch] = useState("");
  const [user1, setUser1] = useState<UserItem | null>(null);
  const [user2, setUser2] = useState<UserItem | null>(null);
  const [page, setPage] = useState(1);

  // Selected conversation and messages state
  const [selectedConversation, setSelectedConversation] = useState<ChatConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [, setMsgPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Fetch Conversations List
  const loadConversations = useCallback(async () => {
    setLoading(true);
    const res = await fetchChatConversations({
      page,
      limit: LIMIT,
      search: search,
      user1Id: user1?._id,
      user2Id: user2?._id,
    });

    if (res.success && res.data) {
      setConversations(res.data.conversations || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } else {
      toast(res.message || "Failed to load conversations");
    }
    setLoading(false);
  }, [page, search, user1?._id, user2?._id, toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Fetch Messages for Selected Conversation
  const loadMessages = useCallback(
    async (convId: string) => {
      setMessagesLoading(true);
      const res = await fetchChatMessages(convId, { limit: 100 });
      if (res.success && res.data) {
        // Backend returns newest first; reverse for standard top-to-bottom chat timeline
        const sorted = (res.data.messages || []).slice().reverse();
        setMessages(sorted);
        if (res.data.pagination) {
          setMsgPagination(res.data.pagination);
        }
      } else {
        toast(res.message || "Failed to load message thread");
      }
      setMessagesLoading(false);
    },
    [toast]
  );

  const handleSelectConversation = (conv: ChatConversationItem) => {
    setSelectedConversation(conv);
    loadMessages(conv._id);
  };

  const handleResetFilters = () => {
    setSearch("");
    setUser1(null);
    setUser2(null);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        actions={
          <button className="btn btn-ghost sm" onClick={loadConversations}>
            <RotateCw size={13} /> Refresh
          </button>
        }
      />

      {/* User Search & User 1 / User 2 Filter Toolbar */}
      <div className="relative z-30">
        <ChatUserSelectFilter
          search={search}
          user1={user1}
          user2={user2}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          onUser1Change={(u) => {
            setUser1(u);
            setPage(1);
          }}
          onUser2Change={(u) => {
            setUser2(u);
            setPage(1);
          }}
          onReset={handleResetFilters}
        />
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px] relative z-10">
        {/* Left Column: Conversation List */}
        <div className={`lg:col-span-5 xl:col-span-4 flex flex-col gap-4 ${selectedConversation ? "hidden lg:flex" : "flex"}`}>
          <ChatConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            loading={loading}
            onSelectConversation={handleSelectConversation}
            pagination={pagination}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>

        {/* Right Column: Chat Messages View */}
        <div className={`lg:col-span-7 xl:col-span-8 flex flex-col ${!selectedConversation ? "hidden lg:flex" : "flex"}`}>
          <ChatMessageViewer
            selectedConversation={selectedConversation}
            messages={messages}
            loading={messagesLoading}
            onClearSelected={() => setSelectedConversation(null)}
          />
        </div>
      </div>
    </div>
  );
}
