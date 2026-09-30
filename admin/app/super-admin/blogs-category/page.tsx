import BlogCategoryManager from "@/components/my/content/blog-category/BlogCategoryManager";

export default function SuperAdminBlogsCategoryPage() {
  return (
    <BlogCategoryManager
      eyebrow="Super Admin Panel"
      title="Blog Category Management"
      sub="Manage master blog categories used to classify blog posts."
    />
  );
}
