"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumeAnalysis } from "@/types";

export function ParsedResumePreview({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Parsed resume preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-lg font-semibold">
              {analysis.fullName || "Name not detected"}
            </p>
            {analysis.professionalTitle && (
              <p className="text-muted-foreground">{analysis.professionalTitle}</p>
            )}
          </div>

          {(analysis.contact?.email ||
            analysis.contact?.phone ||
            analysis.contact?.github ||
            analysis.contact?.linkedin ||
            analysis.contact?.portfolio) && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {analysis.contact.email && <span>{analysis.contact.email}</span>}
              {analysis.contact.phone && <span>{analysis.contact.phone}</span>}
              {analysis.contact.location && <span>{analysis.contact.location}</span>}
              {analysis.contact.github && <span>{analysis.contact.github}</span>}
              {analysis.contact.linkedin && <span>{analysis.contact.linkedin}</span>}
              {analysis.contact.portfolio && (
                <span>{analysis.contact.portfolio}</span>
              )}
            </div>
          )}

          {analysis.summary && (
            <div>
              <p className="mb-1 font-medium">Summary</p>
              <p className="text-muted-foreground">{analysis.summary}</p>
            </div>
          )}

          <div>
            <p className="mb-2 font-medium">Technical skills</p>
            <div className="flex flex-wrap gap-2">
              {(analysis.technicalSkills?.length
                ? analysis.technicalSkills
                : analysis.skills
              ).map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {(analysis.softSkills?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 font-medium">Soft skills</p>
              <div className="flex flex-wrap gap-2">
                {analysis.softSkills!.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.experience.length > 0 && (
            <div className="space-y-3">
              <p className="font-medium">Experience</p>
              {analysis.experience.map((exp, i) => (
                <div key={`${exp.company}-${i}`} className="rounded-lg border border-border/50 p-3">
                  <p className="font-medium">
                    {exp.role}
                    {exp.company ? ` · ${exp.company}` : ""}
                  </p>
                  {exp.duration && (
                    <p className="text-xs text-muted-foreground">{exp.duration}</p>
                  )}
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {exp.highlights.map((h) => (
                      <li key={h}>• {h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {analysis.projects.length > 0 && (
            <div className="space-y-3">
              <p className="font-medium">Projects</p>
              {analysis.projects.map((project, i) => (
                <div key={`${project.name}-${i}`} className="rounded-lg border border-border/50 p-3">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-muted-foreground">{project.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.technologies.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {analysis.education.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Education</p>
              {analysis.education.map((edu, i) => (
                <p key={`${edu.institution}-${i}`} className="text-muted-foreground">
                  {[edu.degree, edu.institution, edu.year].filter(Boolean).join(" · ")}
                </p>
              ))}
            </div>
          )}

          {(analysis.certifications?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 font-medium">Certifications</p>
              <div className="flex flex-wrap gap-2">
                {analysis.certifications!.map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(analysis.languages?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 font-medium">Languages</p>
              <div className="flex flex-wrap gap-2">
                {analysis.languages!.map((l) => (
                  <Badge key={l} variant="outline">
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(analysis.achievements?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 font-medium">Achievements</p>
              <ul className="space-y-1 text-muted-foreground">
                {analysis.achievements!.map((a) => (
                  <li key={a}>• {a}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
