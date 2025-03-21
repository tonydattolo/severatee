import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/app/utils/supabase/server";
import { cookies } from "next/headers";
import db from "@/app/utils/db/db";
import { oauthTokens } from "@/app/utils/db/schemas/oauth_tokens_schema";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/lumon/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      // Store tokens in database
      if (data.session.provider_token && data.session.provider_refresh_token) {
        const userId = data.session.user.id;
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + 3600); // Assuming 1 hour expiry

        // Store in database using Drizzle
        await db
          .insert(oauthTokens)
          .values({
            userId,
            provider: "google",
            accessToken: data.session.provider_token,
            refreshToken: data.session.provider_refresh_token,
            expiresAt: expiresAt,
            scopes: "email profile",
          })
          .onConflictDoUpdate({
            target: [oauthTokens.userId, oauthTokens.provider],
            set: {
              accessToken: data.session.provider_token,
              refreshToken: data.session.provider_refresh_token,
              expiresAt: expiresAt,
              updatedAt: new Date(),
            },
          });
      }

      // Also store in cookies for immediate client access
      const cookiesStore = await cookies();

      if (data.session.provider_token) {
        cookiesStore.set("oauth_provider_token", data.session.provider_token, {
          path: "/",
          httpOnly: false, // Allow JavaScript access
          secure: process.env.NODE_ENV !== "development",
          maxAge: 3600, // 1 hour
          sameSite: "lax",
        });
      }

      if (data.session.provider_refresh_token) {
        cookiesStore.set(
          "oauth_provider_refresh_token",
          data.session.provider_refresh_token,
          {
            path: "/",
            httpOnly: false, // Allow JavaScript access
            secure: process.env.NODE_ENV !== "development",
            maxAge: 30 * 24 * 60 * 60, // 30 days
            sameSite: "lax",
          },
        );
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
