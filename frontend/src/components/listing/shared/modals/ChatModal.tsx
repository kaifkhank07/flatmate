"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Check, Loader2, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { createConversationApi, sendChatMessageApi } from "@/lib/apiServices";
import BaseModal from "./BaseModal";
import LoginRequiredView from "./LoginRequiredView";

export interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  userImage?: string;
  receiverId?: string;
  targetType?: string;
  targetId?: string;
}

export default function ChatModal({
  isOpen,
  onClose,
  name,
  userImage,
  receiverId,
  targetType,
  targetId,
}: ChatModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAuthenticated = Boolean(user);

  const [chatMessage, setChatMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setChatError(null);

    if (!isAuthenticated) {
      setChatError("Authentication required. Please log in to send messages.");
      return;
    }

    const messageText = chatMessage.trim();
    if (!messageText || isSending) return;

    if (!receiverId) {
      setChatError("Owner details are unavailable for this listing.");
      return;
    }

    setIsSending(true);

    try {
      // 1. Create or retrieve the conversation
      const convRes = await createConversationApi(receiverId);

      const conversationId =
        convRes?.data?._id ||
        convRes?.data?.conversation?._id ||
        convRes?.data?.id;

      if (!conversationId) {
        throw new Error(convRes?.message || "Failed to initialize conversation.");
      }

      // 2. Send the text message
      const messageRes = await sendChatMessageApi(conversationId, {
        text: messageText,
        type: "text",
      });

      if (!messageRes || messageRes.success === false) {
        throw new Error(messageRes?.message || "Failed to send message.");
      }

      setSendSuccess(true);
      setChatMessage("");

      setTimeout(() => {
        onClose();
        setSendSuccess(false);
        router.push("/chat");
      }, 1200);
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send message.";

      setChatError(apiMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center gap-3 mb-4 border-b pb-4">
        <div className="w-12 h-12 rounded-full bg-[#3BB799] flex items-center justify-center overflow-hidden shrink-0">
          {userImage ? (
            <img src={userImage} alt={name} className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="50" fill="#3BB799" />
              <circle cx="50" cy="44" r="20" fill="#F8B195" />
              <path d="M20 95C20 76 34 68 50 68C66 68 80 76 80 95V100H20V95Z" fill="#EC4899" />
            </svg>
          )}
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-900">{name}</h4>
        </div>
      </div>

      {!isAuthenticated ? (
        <LoginRequiredView
          title={`Chat with ${name}`}
          description="Please log in to your account to send direct messages and chat with the owner."
          icon={<MessageSquare className="w-8 h-8 text-[#0066FF] stroke-[2.2]" />}
          actionText="Log In to Send Message"
          onClose={onClose}
        />
      ) : sendSuccess ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Message sent successfully!</p>
          <p className="text-xs text-gray-500">Redirecting to chatbox...</p>
        </div>
      ) : (
        <form onSubmit={handleSendChat} className="space-y-4">
          <div className="bg-gray-100 p-3 rounded-2xl text-xs text-gray-700 max-w-[85%] leading-relaxed">
            Hi! Interested in the listing? Feel free to send me a message.
          </div>

          {chatError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {chatError}
            </div>
          )}

          <div className="flex w-full min-w-0 items-center gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
              className="min-w-0 flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-[#0066FF] disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={isSending || !chatMessage.trim()}
              className="w-10 h-10 bg-[#0066FF] hover:bg-blue-700 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
}
