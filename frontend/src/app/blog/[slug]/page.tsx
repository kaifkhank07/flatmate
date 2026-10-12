import React from "react";
import BlogDetails from "@/components/blog/BlogDetails";

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolvedParams = await params;

  return (
    <main className="w-full min-h-screen pt-8 sm:pt-20">
      <BlogDetails slug={resolvedParams.slug} />
    </main>
  );
}