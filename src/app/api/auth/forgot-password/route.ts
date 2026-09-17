import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 422 });
  }

  const supabase = await createClient();
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/reset-password`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}