import { Sidebar } from "./sidebar";
import { BackToHomeButton } from "./back-to-home-button";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-3xl" />
      </div>
      <Sidebar />
      <main className="relative lg:pl-64">
        <div className="container mx-auto max-w-7xl px-4 py-8 pt-16 lg:pt-8">
          <BackToHomeButton />
          {children}
        </div>
      </main>
    </div>
  );
}
