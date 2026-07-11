import { apiError, apiSuccess } from "@/lib/api/response";
import { getUserProfile } from "@/lib/queries";

export async function GET() {
  try {
    const profile = await getUserProfile();
    return apiSuccess(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError(message, status);
  }
}
