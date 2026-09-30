import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Notifications",
  description: "View and manage your account notifications and match alerts.",
};

export default function MyNotificationsPage() {
  return (
    <main className="w-full min-h-[60vh] flex flex-col items-center justify-center pt-24 px-4">
      <div className="text-center space-y-3 max-w-md">
        <h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500">
          Your match alerts, messages, and listing updates will appear here.
        </p>
      </div>
    </main>
  );
}
