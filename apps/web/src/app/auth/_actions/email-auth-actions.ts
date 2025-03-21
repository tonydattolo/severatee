"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/server";
import { isAuthApiError, isAuthError } from "@supabase/supabase-js";
import { env } from "@/env";

export async function login(
  prevState: any,
  formData: FormData,
): Promise<{
  message?: string | null;
  error?: string | null;
  email?: string | null;
  password?: string | null;
}> {
  const supabase = await createClient();

  const loginFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginFormData.email,
      password: loginFormData.password,
    });

    if (error) {
      return {
        error: "Invalid email or password",
        email: loginFormData.email,
      };
    }

    if (data) {
      revalidatePath("/lumon/dashboard", "layout");
      return { message: "Login successful" };
    }

    return { message: "Login successful" };
  } catch (error) {
    if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
      return {
        error: "An unexpected error occurred",
        email: loginFormData.email,
      };
    }
    throw error;
  }
}

export async function signup(
  state: { message?: string; error?: string },
  formData: FormData,
): Promise<{ message?: string; error?: string }> {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp(data);

  if (error) {
    console.error(error);
    return { error: "Something went wrong during signup" };
  }

  if (user) {
    // Check if the user's email is confirmed
    if (user.email_confirmed_at) {
      revalidatePath("/lumon/dashboard", "layout");
      redirect("/lumon/dashboard");
    } else {
      return {
        message: `Verification email sent to ${user.email}. Please check your inbox.`,
      };
    }
  }

  return { error: "Unexpected error occurred" };
}
