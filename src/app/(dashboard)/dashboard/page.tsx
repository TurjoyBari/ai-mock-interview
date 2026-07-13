import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";
import { getDashboardAnalytics } from "@/lib/queries";

export default async function DashboardPage() {
  const analytics = await getDashboardAnalytics("all");

  return (
    <AnalyticsDashboard initialData={analytics} initialRange="all" />
  );
}
