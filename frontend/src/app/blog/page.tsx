import React from "react";
import { Metadata } from "next";
import BlogManager from "@/components/blog/BlogManager";

export const metadata: Metadata = {
  title: "Blog",
  description: "Read the latest blog posts about living and flatsharing.",
};

export default function BlogPage() {
  return (
    <main className="w-full min-h-screen pt-8 sm:pt-20">
      <BlogManager />
    </main>
  );
}
