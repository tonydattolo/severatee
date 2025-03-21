"use server";

import { createClient } from "@/app/utils/supabase/server";

export const signOut = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error: "Failed to sign out. Please try again." };
  }
};
