import UserPreferencesManager from "@/components/my/user/preference/UserPreferencesManager";

export default function AdminUserPreferencesPage() {
  return (
    <UserPreferencesManager
      eyebrow="Admin Panel"
      title="User Preference Options"
      sub="View, create, edit, and manage user preference options."
    />
  );
}
