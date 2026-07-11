import { auth, currentUser } from "@clerk/nextjs/server";
import type { User as ClerkUser } from "@clerk/backend";
import { prisma } from "./prisma";

type ClerkWebhookUser = {
  id: string;
  email_addresses: Array<{ id: string; email_address: string }>;
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string;
};

export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function requireAuthUserId(): Promise<string> {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function getPrimaryEmailFromClerkUser(clerkUser: ClerkUser): string | null {
  const primary = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId
  );
  return primary?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;
}

function getPrimaryEmailFromWebhookUser(user: ClerkWebhookUser): string | null {
  const primary = user.email_addresses.find(
    (email) => email.id === user.primary_email_address_id
  );
  return primary?.email_address ?? user.email_addresses[0]?.email_address ?? null;
}

async function upsertDbUser(input: {
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}) {
  return prisma.user.upsert({
    where: { clerkId: input.clerkId },
    update: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      imageUrl: input.imageUrl,
    },
    create: {
      clerkId: input.clerkId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      imageUrl: input.imageUrl,
      settings: {
        create: {},
      },
    },
    include: {
      settings: true,
    },
  });
}

export async function syncUserFromClerk(clerkUser: ClerkUser) {
  const email = getPrimaryEmailFromClerkUser(clerkUser);
  if (!email) {
    throw new Error("Clerk user is missing a primary email address");
  }

  return upsertDbUser({
    clerkId: clerkUser.id,
    email,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
  });
}

export async function syncUserFromWebhook(user: ClerkWebhookUser) {
  const email = getPrimaryEmailFromWebhookUser(user);
  if (!email) {
    throw new Error("Clerk webhook user is missing a primary email address");
  }

  return upsertDbUser({
    clerkId: user.id,
    email,
    firstName: user.first_name,
    lastName: user.last_name,
    imageUrl: user.image_url,
  });
}

export async function getOrCreateDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  return syncUserFromClerk(clerkUser);
}

export async function requireDbUser() {
  const user = await getOrCreateDbUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function deleteUserByClerkId(clerkId: string) {
  await prisma.user.deleteMany({ where: { clerkId } });
}
