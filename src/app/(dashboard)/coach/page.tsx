"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateWeeklyCoachPlan } from "@/lib/actions";
import { fetchApiArray } from "@/lib/api/client";

interface CoachPlan {
  id: string;
  topics: string[];
  projects: string[];
  codingProblems: string[];
  behavioral: string[];
  resumeTips: string[];
  companyRoadmap: Record<string, string[]>;
  fullPlan: {
    weeklySchedule?: { day: string; tasks: string[] }[];
  };
  createdAt: string;
}

export default function CoachPage() {
  const [plans, setPlans] = useState<CoachPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<CoachPlan | null>(null);

  useEffect(() => {
    fetchApiArray<CoachPlan>("/api/coach")
      .then((data) => {
        setPlans(data);
        if (data.length > 0) setCurrentPlan(data[0]);
      })
      .finally(() => setInitialLoading(false));
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const plan = await generateWeeklyCoachPlan();
      const newPlan: CoachPlan = {
        id: Date.now().toString(),
        topics: plan.topics,
        projects: plan.projects,
        codingProblems: plan.codingProblems,
        behavioral: plan.behavioral,
        resumeTips: plan.resumeTips,
        companyRoadmap: plan.companyRoadmap,
        fullPlan: plan,
        createdAt: new Date().toISOString(),
      };
      setPlans((prev) => [newPlan, ...prev]);
      setCurrentPlan(newPlan);
      toast.success("Weekly plan generated!");
    } catch {
      toast.error("Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Coach"
        description={
          plans.length > 0
            ? `${plans.length} weekly plan${plans.length === 1 ? "" : "s"} generated`
            : "Your personal interview preparation mentor"
        }
      >
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Generate Weekly Plan
        </Button>
      </PageHeader>

      {!currentPlan ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <GraduationCap className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Complete a few interviews first, then generate your personalized plan
            </p>
            <Button className="mt-4" onClick={handleGenerate} disabled={loading}>
              Generate Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Topics to Study</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentPlan.topics.map((topic) => (
                  <Badge key={topic} variant="secondary">{topic}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coding Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentPlan.codingProblems.map((p, i) => (
                  <li key={i} className="text-sm rounded-lg border border-border/50 p-3">{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projects to Build</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentPlan.projects.map((p, i) => (
                  <li key={i} className="text-sm rounded-lg border border-border/50 p-3">{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Behavioral Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentPlan.behavioral.map((b, i) => (
                  <li key={i} className="text-sm rounded-lg border border-border/50 p-3">{b}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {currentPlan.fullPlan?.weeklySchedule && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {currentPlan.fullPlan.weeklySchedule.map((day) => (
                    <div key={day.day} className="rounded-xl border border-border/50 p-4">
                      <p className="font-medium mb-2">{day.day}</p>
                      <ul className="space-y-1">
                        {day.tasks.map((task, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {task}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {Object.keys(currentPlan.companyRoadmap ?? {}).length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Company Preparation Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(currentPlan.companyRoadmap).map(([company, steps]) => (
                    <div key={company} className="rounded-xl border border-border/50 p-4">
                      <p className="font-medium mb-2">{company}</p>
                      <ul className="space-y-1">
                        {steps.map((step, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {step}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
