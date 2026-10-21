import AdminNotificationsManager from "@/components/my/notification/AdminNotificationsManager";

export default function AdminNotificationsPage() {
  return (
    <AdminNotificationsManager
      eyebrow="Admin Panel"
      title="Notifications & Alerts"
      sub="Review platform notifications, moderation updates, and manage your delivery preferences."
      baseRoute="/admin"
    />
  );
}
