import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with your prospective flatmates.",
};

export default function ChatPage() {
  return (
    <main className="w-full min-h-[60vh] flex flex-col items-center justify-center pt-24 px-4">
      <div className="text-center space-y-3 max-w-md">
        <h1 className="text-3xl font-semibold text-gray-900">Messages & Chat</h1>
        <p className="text-sm text-gray-500">
          Your conversations with flatmates and property owners will appear here.
        </p>
      </div>
    </main>
  );
}
