import { apiError, apiSuccess } from "@/lib/api/response";
import { getJobMatches } from "@/lib/queries";

export async function GET() {
  try {
    const matches = await getJobMatches();
    return apiSuccess(matches);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError(message, status);
  }
}
