"use client";

import { useMemo, useState } from "react";
import { Search, CheckSquare, Square, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TOPIC_DIFFICULTY_LEVELS } from "@/lib/constants";
import {
  createDefaultTopicSelection,
  estimateInterviewDurationMinutes,
  getAvailableTopics,
  getFlatAvailableTopicNames,
  sumTopicQuestionCounts,
} from "@/lib/interview-topics";
import type {
  InterviewType,
  TopicDifficulty,
  TopicSelection,
} from "@/types";

interface TopicSelectionPanelProps {
  interviewType: string;
  techStack: string[];
  topics: TopicSelection[];
  onTopicsChange: (topics: TopicSelection[]) => void;
}

export function TopicSelectionPanel({
  interviewType,
  techStack,
  topics,
  onTopicsChange,
}: TopicSelectionPanelProps) {
  const [search, setSearch] = useState("");

  const catalogs = useMemo(
    () => getAvailableTopics(interviewType as InterviewType, techStack),
    [interviewType, techStack]
  );

  const allTopicNames = useMemo(
    () => getFlatAvailableTopicNames(interviewType as InterviewType, techStack),
    [interviewType, techStack]
  );

  const totalQuestions = sumTopicQuestionCounts(topics);
  const estimatedDuration = estimateInterviewDurationMinutes(totalQuestions);
  const query = search.trim().toLowerCase();

  const toggleTopic = (name: string) => {
    const exists = topics.find((t) => t.name === name);
    if (exists) {
      onTopicsChange(topics.filter((t) => t.name !== name));
      return;
    }
    onTopicsChange([...topics, createDefaultTopicSelection(name, "medium")]);
  };

  const updateTopic = (name: string, patch: Partial<TopicSelection>) => {
    onTopicsChange(
      topics.map((t) => (t.name === name ? { ...t, ...patch } : t))
    );
  };

  const selectAllVisible = () => {
    const visible = allTopicNames.filter((name) =>
      query ? name.toLowerCase().includes(query) : true
    );
    const map = new Map(topics.map((t) => [t.name, t]));
    for (const name of visible) {
      if (!map.has(name)) {
        map.set(name, createDefaultTopicSelection(name, "medium"));
      }
    }
    onTopicsChange([...map.values()]);
  };

  const clearAll = () => onTopicsChange([]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label className="text-base">Interview Topics</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Topics update automatically when you change Interview Type. Select
            topics, set difficulty and question count for each.
          </p>
        </div>
        <Badge variant="secondary">{topics.length} selected</Badge>
      </div>

      {catalogs.length === 0 || allTopicNames.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          {interviewType === "custom"
            ? "Add technologies to your stack to load custom topics."
            : "No topics found for this interview type."}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllVisible}
              >
                <CheckSquare className="mr-1.5 h-4 w-4" />
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={topics.length === 0}
              >
                <Square className="mr-1.5 h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>

          <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-border/50 p-4">
            {catalogs.map((catalog) => {
              const visibleTopics = catalog.topics.filter((name) =>
                query ? name.toLowerCase().includes(query) : true
              );
              if (visibleTopics.length === 0) return null;

              return (
                <div key={catalog.catalogKey} className="space-y-3">
                  <p className="text-sm font-medium">{catalog.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {visibleTopics.map((topicName) => {
                      const selected = topics.some((t) => t.name === topicName);
                      return (
                        <button
                          key={topicName}
                          type="button"
                          onClick={() => toggleTopic(topicName)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/60 text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {topicName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {query &&
              catalogs.every(
                (c) =>
                  c.topics.filter((n) => n.toLowerCase().includes(query))
                    .length === 0
              ) && (
                <p className="text-sm text-muted-foreground">
                  No topics match “{search}”.
                </p>
              )}
          </div>
        </>
      )}

      {topics.length > 0 ? (
        <div className="space-y-3">
          <Label>Selected Topics</Label>
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Topic</th>
                  <th className="px-3 py-2 font-medium">Difficulty</th>
                  <th className="px-3 py-2 font-medium">Questions</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.name} className="border-t border-border/40">
                    <td className="px-3 py-2 font-medium">{topic.name}</td>
                    <td className="px-3 py-2">
                      <Select
                        value={topic.difficulty}
                        onValueChange={(v) =>
                          updateTopic(topic.name, {
                            difficulty: v as TopicDifficulty,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TOPIC_DIFFICULTY_LEVELS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        className="h-9 w-20"
                        value={topic.questionCount}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          updateTopic(topic.name, {
                            questionCount: Number.isFinite(raw)
                              ? Math.min(20, Math.max(1, Math.floor(raw)))
                              : 1,
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => toggleTopic(topic.name)}
                        aria-label={`Remove ${topic.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-destructive">
          Select at least one topic to create an interview.
        </p>
      )}

      <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Selected Topics</p>
          <p className="mt-1 text-2xl font-semibold">{topics.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Questions</p>
          <p className="mt-1 text-2xl font-semibold">{totalQuestions}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estimated Duration</p>
          <p className="mt-1 text-2xl font-semibold">{estimatedDuration} min</p>
        </div>
      </div>
    </div>
  );
}
