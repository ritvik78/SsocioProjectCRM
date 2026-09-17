import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message === "Invalid login credentials" ? "Invalid email or password" : error?.message ?? "Sign-in failed" },
      { status: 401 }
    );
  }

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
}