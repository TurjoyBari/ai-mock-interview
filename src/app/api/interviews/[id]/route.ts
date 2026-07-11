import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getInterview } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const interview = await getInterview(id);

    if (!interview) {
      return apiError("Not found", 404);
    }

    return apiSuccess(interview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError(message, status);
  }
}
