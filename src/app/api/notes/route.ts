import { apiError, apiSuccess } from "@/lib/api/response";
import { getNotes } from "@/lib/queries";

export async function GET() {
  try {
    const notes = await getNotes();
    return apiSuccess(notes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError(message, status);
  }
}
