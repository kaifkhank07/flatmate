import AdminNotificationsManager from "@/components/my/notification/AdminNotificationsManager";

export default function SuperAdminNotificationsPage() {
  return (
    <AdminNotificationsManager
      eyebrow="Super Admin Panel"
      title="Notifications & Alerts"
      sub="Review platform notifications, staff notices, system alerts, and configure delivery preferences."
      baseRoute="/super-admin"
    />
  );
}
