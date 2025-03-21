"use server";

import { createClient } from "@/app/utils/supabase/server";
import { cookies } from "next/headers";
import db from "@/server/db/db";
import { oauthTokens } from "@/server/db/schemas/oauth_tokens_schema";
import { env } from "@/env";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
  const supabase = await createClient();

  // Get the absolute URL for the redirect
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.VERCEL_URL ||
        "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/google`,
      // Request offline access to get a refresh token
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      // Specify the scopes you need for your CRM email functionality
      scopes: "email profile",
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error);
    return { error: "Failed to sign in with Google" };
  }

  // Redirect the user to the Google authorization URL
  if (data?.url) {
    redirect(data.url);
  }

  return { error: "Failed to generate Google sign-in URL" };
}

/**
 * Server action to refresh a Google OAuth token
 * This runs on the server and has access to environment variables
 */
export async function refreshGoogleToken(refreshToken?: string): Promise<{
  accessToken?: string;
  expiresAt?: Date;
  error?: string;
}> {
  try {
    // Get the user's session
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session?.user?.id) {
      return { error: "No authenticated user found" };
    }

    const userId = sessionData.session.user.id;

    // If no refresh token provided, try to get it from the database
    if (!refreshToken) {
      // Get the refresh token from the database
      const tokenRecord = await db.query.oauthTokens.findFirst({
        where: and(
          eq(oauthTokens.userId, userId),
          eq(oauthTokens.provider, "google"),
        ),
      });

      if (!tokenRecord?.refreshToken) {
        return { error: "No refresh token found" };
      }

      refreshToken = tokenRecord.refreshToken;
    }

    // Make the request to Google's OAuth server
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env.GOOGLE_OAUTH_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_description || "Failed to refresh token");
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in || 3600; // Default to 1 hour if not provided

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Update the token in the database
    await db
      .update(oauthTokens)
      .set({
        accessToken: accessToken,
        expiresAt: expiresAt,
      })
      .where(
        and(eq(oauthTokens.userId, userId), eq(oauthTokens.provider, "google")),
      );

    // Update cookies for client-side access
    const cookieStore = await cookies();
    cookieStore.set("oauth_provider_token", accessToken, {
      path: "/",
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV !== "development",
      maxAge: expiresIn,
      sameSite: "lax",
    });

    return {
      accessToken,
      expiresAt,
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Check if a token needs refreshing and refresh it if needed
 */
export async function ensureFreshToken(): Promise<{
  accessToken?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session?.user?.id) {
      return { error: "No authenticated user found" };
    }

    const userId = sessionData.session.user.id;

    // Get the current token from the database
    const tokenRecord = await db.query.oauthTokens.findFirst({
      where: and(
        eq(oauthTokens.userId, userId),
        eq(oauthTokens.provider, "google"),
      ),
    });

    if (!tokenRecord) {
      return { error: "No token found" };
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000); // Current time + 5 minutes

    if (tokenRecord.expiresAt > expiryBuffer) {
      // Token is still valid
      return { accessToken: tokenRecord.accessToken };
    }

    // Token needs refreshing
    return await refreshGoogleToken(tokenRecord.refreshToken);
  } catch (error) {
    console.error("Error ensuring fresh token:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
