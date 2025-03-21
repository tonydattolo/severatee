import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();
    if (!error) {
      // redirect user to specified redirect URL or root of app
      revalidatePath("/");
      redirect("/");
    } else {
      throw new Error("Error signing out");
    }
  } catch (error) {
    console.error("Error signing out:", error);
  }
}
