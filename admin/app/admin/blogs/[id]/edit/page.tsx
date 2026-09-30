import EditBlogPage from "@/components/my/content/blog/EditBlogPage";

export default async function AdminBlogEditRoute({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  return <EditBlogPage blogId={resolvedParams.id} eyebrow="Admin Panel" />;
}
