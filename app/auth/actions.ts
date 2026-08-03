"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; message?: string };

export async function signInWithEmail(formData: FormData): Promise<ActionResult> {
    const supabase = createClient();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signUpWithEmail(formData: FormData): Promise<ActionResult> {
    const supabase = createClient();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
    });
    if (error) return { error: error.message };

    if (!data.session) {
        return { message: "Check your email to confirm your account." };
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signOut(): Promise<ActionResult> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };

    revalidatePath("/", "layout");
    redirect("/");
}
