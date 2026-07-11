"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, StickyNote } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { noteSchema, type NoteInput } from "@/lib/validations";
import { createNote } from "@/lib/actions";
import { fetchApiArray } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const form = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "", tags: [] },
  });

  useEffect(() => {
    fetchApiArray<Note>("/api/notes")
      .then(setNotes)
      .catch(() => {});
  }, []);

  const onSubmit = async (data: NoteInput) => {
    try {
      const note = await createNote(data);
      setNotes((prev) => [note as unknown as Note, ...prev]);
      form.reset();
      setShowForm(false);
      toast.success("Note created!");
    } catch {
      toast.error("Failed to create note");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Notes" description="Save insights and bookmark feedback">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </PageHeader>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input {...form.register("title")} placeholder="Note title" />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea {...form.register("content")} placeholder="Write your note..." />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <StickyNote className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No notes yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-1">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                  selectedNote?.id === note.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:bg-accent/50"
                }`}
              >
                <p className="font-medium truncate">{note.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(note.updatedAt)}
                </p>
              </button>
            ))}
          </div>
          {selectedNote && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{selectedNote.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{selectedNote.content}</p>
                {selectedNote.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedNote.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
