import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/features(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
  "/api/uploadthing(.*)",
  "/share/(.*)",
]);

const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, redirectToSignIn } = await auth();

  // Logged-in users shouldn't stay on sign-in / sign-up
  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: request.url });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
