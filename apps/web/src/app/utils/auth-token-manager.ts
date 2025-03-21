import { createClient } from "@/app/utils/supabase/client";
import { refreshGoogleToken } from "@/app/auth/_actions/google-auth-actions";

class TokenManager {
  private tokens: {
    [provider: string]: {
      accessToken: string;
      refreshToken: string | null;
      expiresAt: number;
    };
  } = {};

  constructor() {
    // Try to load tokens from localStorage on initialization
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("oauth_provider_token");
      const storedRefreshToken = localStorage.getItem(
        "oauth_provider_refresh_token",
      );

      if (storedToken) {
        this.tokens["google"] = {
          accessToken: storedToken,
          refreshToken: storedRefreshToken,
          // Set a default expiry time if we don't know when it expires
          expiresAt: Date.now() + 3500 * 1000, // Slightly less than 1 hour
        };
      }
    }
  }

  async getProviderToken(provider: string): Promise<string | null> {
    // Check if we have a valid token
    if (
      this.tokens[provider] &&
      this.tokens[provider].accessToken &&
      Date.now() < this.tokens[provider].expiresAt
    ) {
      return this.tokens[provider].accessToken;
    }

    // If we have a refresh token, try to refresh
    if (this.tokens[provider]?.refreshToken) {
      const newToken = await this.refreshToken(provider);
      if (newToken) {
        return newToken;
      }
    }

    // Try to get token from localStorage
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("oauth_provider_token");
      if (storedToken) {
        this.tokens[provider] = {
          accessToken: storedToken,
          refreshToken: localStorage.getItem("oauth_provider_refresh_token"),
          expiresAt: Date.now() + 3500 * 1000, // Assume it's valid for almost an hour
        };
        return storedToken;
      }
    }

    // Try to get token from Supabase session
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (data?.session?.provider_token) {
        this.tokens[provider] = {
          accessToken: data.session.provider_token,
          refreshToken: data.session.provider_refresh_token || null,
          expiresAt: Date.now() + 3500 * 1000, // Assume it's valid for almost an hour
        };

        // Store in localStorage for future use
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "oauth_provider_token",
            data.session.provider_token,
          );
          if (data.session.provider_refresh_token) {
            localStorage.setItem(
              "oauth_provider_refresh_token",
              data.session.provider_refresh_token,
            );
          }
        }

        return data.session.provider_token;
      }
    } catch (error) {
      console.error("Error getting session:", error);
    }

    return null;
  }

  async refreshToken(provider: string): Promise<string | null> {
    if (provider !== "google") {
      return null;
    }

    try {
      // Use the server action to refresh the token
      // This ensures the refresh happens on the server with access to env vars
      // and updates the database
      const result = await refreshGoogleToken();

      if (result.error || !result.accessToken) {
        throw new Error(result.error || "Failed to refresh token");
      }

      // Update our stored token
      this.tokens[provider] = {
        accessToken: result.accessToken,
        refreshToken: this.tokens[provider]?.refreshToken || null,
        expiresAt: result.expiresAt
          ? result.expiresAt.getTime()
          : Date.now() + 3500 * 1000,
      };

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("oauth_provider_token", result.accessToken);
      }

      return result.accessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  }

  clearTokens() {
    this.tokens = {};
    if (typeof window !== "undefined") {
      localStorage.removeItem("oauth_provider_token");
      localStorage.removeItem("oauth_provider_refresh_token");
    }
  }
}

// Export a singleton instance
export const tokenManager = new TokenManager();
