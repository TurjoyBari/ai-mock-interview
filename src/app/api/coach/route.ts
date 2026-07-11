import { apiError, apiSuccess } from "@/lib/api/response";
import { getCoachPlans } from "@/lib/queries";

export async function GET() {
  try {
    const plans = await getCoachPlans();
    return apiSuccess(plans);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError(message, status);
  }
}
