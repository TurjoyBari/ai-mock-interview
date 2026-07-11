import { apiError, apiSuccess } from "@/lib/api/response";
import { getResumes } from "@/lib/queries";

export async function GET() {
  try {
    const resumes = await getResumes();
    return apiSuccess(resumes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError(message, status);
  }
}
