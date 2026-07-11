import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { globalSearch } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");
    if (!q?.trim()) return apiSuccess([]);

    const results = await globalSearch(q);
    return apiSuccess(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError(message, status);
  }
}
