import React from "react";
import { Metadata } from "next";
import ChatManager from "@/components/dashboard/chat/ChatManager";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with your prospective flatmates.",
};

export default function ChatPage() {
  return (
    <main className="w-full min-h-screen pt-20">
      <ChatManager />
    </main>
  );
}
