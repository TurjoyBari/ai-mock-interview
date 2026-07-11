"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { updateProfile } from "@/lib/actions";
import { fetchApi } from "@/lib/api/client";
import { EXPERIENCE_LEVELS, COMPANIES } from "@/lib/constants";

interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  targetRole: string | null;
  experienceLevel: string | null;
  preferredStack: string[];
  targetCompanies: string[];
  skills: string[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stackInput, setStackInput] = useState("");

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      targetRole: "",
      experienceLevel: "",
      preferredStack: [],
      targetCompanies: [],
      skills: [],
    },
  });

  const { register, handleSubmit, setValue, watch } = form;
  const preferredStack = watch("preferredStack");
  const targetCompanies = watch("targetCompanies");

  useEffect(() => {
    fetchApi<UserProfile>("/api/profile")
      .then((data) => {
        setProfile(data);
        form.reset({
          targetRole: data.targetRole ?? "",
          experienceLevel: data.experienceLevel ?? "",
          preferredStack: data.preferredStack ?? [],
          targetCompanies: data.targetCompanies ?? [],
          skills: data.skills ?? [],
        });
      })
      .catch(() => {});
  }, [form]);

  const toggleCompany = (company: string) => {
    const current = targetCompanies ?? [];
    setValue(
      "targetCompanies",
      current.includes(company)
        ? current.filter((c) => c !== company)
        : [...current, company]
    );
  };

  const addStack = () => {
    if (stackInput.trim() && !preferredStack.includes(stackInput.trim())) {
      setValue("preferredStack", [...preferredStack, stackInput.trim()]);
      setStackInput("");
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    try {
      await updateProfile(data);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Profile" description="Manage your interview preferences" />

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.imageUrl ?? undefined} />
            <AvatarFallback>
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Career Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Input {...register("targetRole")} placeholder="Senior Software Engineer" />
            </div>
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setValue("experienceLevel", level)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      watch("experienceLevel") === level
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {COMPANIES.filter((c) => c !== "Custom").map((company) => (
                <button
                  key={company}
                  type="button"
                  onClick={() => toggleCompany(company)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    targetCompanies?.includes(company)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50"
                  }`}
                >
                  {company}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferred Stack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={stackInput}
                onChange={(e) => setStackInput(e.target.value)}
                placeholder="Add technology"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStack())}
              />
              <Button type="button" variant="outline" onClick={addStack}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferredStack.map((tech) => (
                <Badge key={tech} variant="secondary">{tech}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">Save Profile</Button>
      </form>
    </div>
  );
}
