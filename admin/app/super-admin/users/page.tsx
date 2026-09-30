import UsersManager from "@/components/my/user/profile/UsersManager";

export default function SuperAdminUsersPage() {
  return (
    <UsersManager
      eyebrow="Super Admin Panel"
      title="User Management"
      sub="Manage users, verification, status updates, blocking, and management of platform flatmate users."
    />
  );
}
