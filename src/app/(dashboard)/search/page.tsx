"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchResult } from "@/types";
import { fetchApiArray } from "@/lib/api/client";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchApiArray<SearchResult>(
        `/api/search?q=${encodeURIComponent(q)}`
      );
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Search"
        description="Search across interviews, reports, and notes"
      />

      <div className="relative max-w-xl">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder="Search interviews, companies, reports..."
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => (
            <Link key={`${result.type}-${result.id}`} href={result.href}>
              <Card className="transition-colors hover:border-primary/30">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{result.type}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No results found</p>
      )}
    </div>
  );
}
