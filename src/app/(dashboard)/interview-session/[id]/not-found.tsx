import Link from "next/link";
import { Button } from "@/components/ui/button";
import { interviewHistoryPath, newInterviewPath } from "@/lib/routes";

export default function InterviewSessionNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">Interview Not Found</h1>
      <p className="max-w-md text-muted-foreground">
        This interview does not exist, may have been deleted, or you do not have
        permission to access it.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={interviewHistoryPath()}>View History</Link>
        </Button>
        <Button asChild>
          <Link href={newInterviewPath()}>Create New Interview</Link>
        </Button>
      </div>
    </div>
  );
}
