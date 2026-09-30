import UserPreferencesManager from "@/components/my/user/preference/UserPreferencesManager";

export default function SuperAdminUserPreferencesPage() {
  return (
    <UserPreferencesManager
      eyebrow="Super Admin Panel"
      title="User Preferences Management"
      sub="Manage user preferences categories (Food, Pets, Drink) and options."
    />
  );
}
