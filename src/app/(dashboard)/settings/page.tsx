"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsSchema, type SettingsInput } from "@/lib/validations";
import { updateSettings } from "@/lib/actions";
import { fetchApi } from "@/lib/api/client";
import { VOICE_OPTIONS } from "@/lib/constants";

export default function SettingsPage() {
  const { setTheme } = useTheme();

  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme: "system",
      language: "en",
      voiceEnabled: true,
      voiceId: "Kore",
      notifications: true,
      hintsEnabled: false,
      cameraDefault: false,
    },
  });

  const { setValue, watch, handleSubmit } = form;

  useEffect(() => {
    fetchApi<SettingsInput | null>("/api/settings")
      .then((data) => {
        if (data) {
          form.reset(data);
          if (data.theme) setTheme(data.theme);
        }
      })
      .catch(() => {});
  }, [form, setTheme]);

  const onSubmit = async (data: SettingsInput) => {
    try {
      await updateSettings(data);
      setTheme(data.theme);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Settings" description="Customize your experience" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setValue("theme", t);
                      setTheme(t);
                    }}
                    className={`flex-1 rounded-xl border p-3 text-sm capitalize transition-colors ${
                      watch("theme") === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Voice</Label>
              <Switch
                checked={watch("voiceEnabled")}
                onCheckedChange={(v) => setValue("voiceEnabled", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>AI Voice</Label>
              <Select
                value={watch("voiceId")}
                onValueChange={(v) => setValue("voiceId", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Hints Enabled by Default</Label>
                <p className="text-sm text-muted-foreground">Allow hints in new interviews</p>
              </div>
              <Switch
                checked={watch("hintsEnabled")}
                onCheckedChange={(v) => setValue("hintsEnabled", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Camera On by Default</Label>
                <p className="text-sm text-muted-foreground">Enable camera in new interviews</p>
              </div>
              <Switch
                checked={watch("cameraDefault")}
                onCheckedChange={(v) => setValue("cameraDefault", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Notifications</Label>
              <Switch
                checked={watch("notifications")}
                onCheckedChange={(v) => setValue("notifications", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">Save Settings</Button>
      </form>
    </div>
  );
}
