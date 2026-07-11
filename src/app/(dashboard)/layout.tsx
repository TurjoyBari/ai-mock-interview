import { getOrCreateDbUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getOrCreateDbUser();

  return <DashboardLayout>{children}</DashboardLayout>;
}
