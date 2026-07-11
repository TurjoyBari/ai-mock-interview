import { apiError, apiSuccess } from "@/lib/api/response";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const resume = await prisma.resume.findFirst({
      where: { id, userId: user.id },
    });
    if (!resume) {
      return apiError("Resume not found", 404);
    }
    return apiSuccess(resume);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError(message, status);
  }
}
