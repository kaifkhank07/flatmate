import UsersManager from "@/components/my/user/profile/UsersManager";

export default function AdminUsersPage() {
  return (
    <UsersManager
      eyebrow="Admin Panel"
      title="User Management"
      sub="View, verify, update, block, and manage platform flatmate users."
    />
  );
}
