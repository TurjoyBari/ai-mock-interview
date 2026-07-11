import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { deleteUserByClerkId, syncUserFromWebhook } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured");
    return apiError("Webhook secret is not configured", 500);
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return apiError("Missing Svix headers", 400);
  }

  const payload = await request.text();

  let event: WebhookEvent;

  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Clerk webhook verification failed:", error);
    return apiError("Invalid webhook signature", 400);
  }

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        await syncUserFromWebhook(event.data);
        break;
      }
      case "user.deleted": {
        const clerkId = event.data.id;
        if (clerkId) {
          await deleteUserByClerkId(clerkId);
        }
        break;
      }
      default:
        break;
    }

    return apiSuccess({ received: true });
  } catch (error) {
    console.error(`Clerk webhook handler failed for ${event.type}:`, error);
    return apiError("Webhook handler failed", 500);
  }
}
