import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getInterviewHistory } from "@/lib/queries";
import { InterviewHistoryList } from "@/components/interview/interview-card";

export default async function InterviewHistoryPage() {
  const interviews = await getInterviewHistory();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Interview History"
        description="Review and replay your past interviews"
      >
        <Button asChild>
          <Link href="/interviews/new">New Interview</Link>
        </Button>
      </PageHeader>

      <InterviewHistoryList interviews={interviews} />
    </div>
  );
}
