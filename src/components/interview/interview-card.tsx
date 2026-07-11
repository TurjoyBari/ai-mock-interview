"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Play, Eye, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteInterview } from "@/lib/actions";
import { interviewDetailPath, interviewSessionPath } from "@/lib/routes";
import { formatRelativeTime, formatScore } from "@/lib/utils";

export interface InterviewListItem {
  id: string;
  title: string;
  status: string;
  createdAt: Date | string;
  overallScore: number | null;
  isFavorite: boolean;
  _count: {
    questions: number;
    answers: number;
  };
}

interface InterviewCardProps {
  interview: InterviewListItem;
  onDeleted: (id: string) => void;
}

export function InterviewCard({ interview, onDeleted }: InterviewCardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    try {
      await deleteInterview(interview.id);
      onDeleted(interview.id);
      setConfirmOpen(false);
      toast.success("Interview deleted successfully");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete interview";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="transition-colors hover:border-primary/30">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {interview.isFavorite && (
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            )}
            <div>
              <p className="font-medium">{interview.title}</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatRelativeTime(interview.createdAt)}</span>
                <span>·</span>
                <span>{interview._count.questions} questions</span>
                <span>·</span>
                <span>{interview._count.answers} answered</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                interview.status === "completed"
                  ? "success"
                  : interview.status === "in_progress"
                    ? "warning"
                    : "secondary"
              }
            >
              {interview.status.replace(/_/g, " ")}
            </Badge>
            {interview.overallScore != null && (
              <Badge variant="outline">
                {formatScore(interview.overallScore)}
              </Badge>
            )}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link href={interviewDetailPath(interview.id)}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              {interview.status !== "completed" && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={interviewSessionPath(interview.id)}>
                    <Play className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                aria-label="Delete interview"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete interview?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{interview.title}&quot; and all
              related data including questions, answers, transcripts, feedback,
              and reports. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface InterviewHistoryListProps {
  interviews: InterviewListItem[];
}

export function InterviewHistoryList({
  interviews: initialInterviews,
}: InterviewHistoryListProps) {
  const [interviews, setInterviews] = useState(initialInterviews);

  const handleDeleted = (id: string) => {
    setInterviews((prev) => prev.filter((item) => item.id !== id));
  };

  if (interviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16">
          <p className="text-muted-foreground">No interviews yet</p>
          <Button className="mt-4" asChild>
            <Link href="/interviews/new">Start your first interview</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {interviews.map((interview) => (
        <InterviewCard
          key={interview.id}
          interview={interview}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
