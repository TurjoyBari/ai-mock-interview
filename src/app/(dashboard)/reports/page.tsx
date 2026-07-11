import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReports } from "@/lib/queries";
import { formatDate, formatScore } from "@/lib/utils";

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="View and download your interview reports"
      />

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No reports yet</p>
            <Button className="mt-4" asChild>
              <Link href="/interviews/new">Complete an interview</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="transition-colors hover:border-primary/30"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {report.interview.company ?? report.interview.type}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>
                  {report.interview.overallScore != null && (
                    <Badge variant="secondary">
                      {formatScore(report.interview.overallScore)}
                    </Badge>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" asChild>
                    <Link href={`/reports/${report.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
