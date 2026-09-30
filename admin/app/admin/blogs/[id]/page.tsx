import BlogDetailsPage from "@/components/my/content/blog/BlogDetailsPage";

export default async function AdminBlogDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  return <BlogDetailsPage blogId={resolvedParams.id} eyebrow="Admin Panel" />;
}
