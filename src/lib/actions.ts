"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  brandSchema,
  campaignSchema,
  followupSchema,
  influencerSchema,
  loginSchema,
  taskSchema,
} from "@/lib/validation";
import { createBrand as createBrandRecord, updateBrand as updateBrandRecord, deleteBrand as deleteBrandRecord } from "@/lib/records/brands";
import { createInfluencer as createInfluencerRecord, updateInfluencer as updateInfluencerRecord, deleteInfluencer as deleteInfluencerRecord } from "@/lib/records/influencers";
import { createCampaign as createCampaignRecord, updateCampaign as updateCampaignRecord, deleteCampaign as deleteCampaignRecord } from "@/lib/records/campaigns";
import {
  createFollowup as createFollowupRecord,
  completeFollowup as completeFollowupRecord,
  rescheduleFollowup as rescheduleFollowupRecord,
  markFollowupOutcome as markFollowupOutcomeRecord,
} from "@/lib/records/followups";
import {
  createTask as createTaskRecord,
  completeTask as completeTaskRecord,
  deleteTask as deleteTaskRecord,
} from "@/lib/records/tasks";

function formDataToObject(formData: FormData) {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  return obj;
}

function requirePermission(session: { user: { role: string; permissions: Set<string> } }, permission: string) {
  if (session.user.role !== "SUPER_ADMIN" && !session.user.permissions.has(permission)) {
    throw new Error("You are not allowed to perform this action");
  }
}

// ---------------------------------- Profile ----------------------------------

export async function updateProfile(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");

  // 2) Validation
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const designation = String(formData.get("designation") ?? "").trim();

  if (!name) throw new Error("Please provide a valid name");

  // 3) Mutation
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, phone: phone || null, designation: designation || null },
  });

  // 4) Revalidation
  revalidatePath("/settings");
}

// ----------------------------------- Brands ---------------------------------

export async function createBrand(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "brands.add");

  // 2) Validation
  const parsed = brandSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Please fix the form errors");

  // 3) Mutation
  const brand = await createBrandRecord(parsed.data, session.user);

  // 4) Revalidation
  revalidatePath("/brands");

  // 5) Redirect
  redirect(`/brands/${brand.id}`);
}

export async function updateBrand(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "brands.edit");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brand not found");

  // 3) Validation
  const parsed = brandSchema.partial().safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Please fix the form errors");

  // 4) Mutation
  await updateBrandRecord(id, parsed.data, session.user);

  // 5) Revalidation
  revalidatePath(`/brands/${id}`);
  revalidatePath("/brands");

  // 6) Redirect
  redirect(`/brands/${id}`);
}

export async function deleteBrand(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "brands.delete");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brand not found");

  // 3) Mutation
  await deleteBrandRecord(id, session.user);

  // 4) Revalidation
  revalidatePath("/brands");

  // 5) Redirect
  redirect("/brands");
}

// --------------------------------- Influencers --------------------------------

export async function createInfluencer(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "influencers.add");

  // 2) Validation
  const parsed = influencerSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Please fix the form errors");

  // 3) Mutation
  const influencer = await createInfluencerRecord(parsed.data, session.user);

  // 4) Revalidation
  revalidatePath("/influencers");

  // 5) Redirect
  redirect(`/influencers/${influencer.id}`);
}

export async function updateInfluencer(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "influencers.edit");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Influencer not found");

  // 3) Validation
  const parsed = influencerSchema.partial().safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Please fix the form errors");

  // 4) Mutation
  await updateInfluencerRecord(id, parsed.data, session.user);

  // 5) Revalidation
  revalidatePath(`/influencers/${id}`);
  revalidatePath("/influencers");

  // 6) Redirect
  redirect(`/influencers/${id}`);
}

export async function deleteInfluencer(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "influencers.delete");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Influencer not found");

  // 3) Mutation
  await deleteInfluencerRecord(id, session.user);

  // 4) Revalidation
  revalidatePath("/influencers");

  // 5) Redirect
  redirect("/influencers");
}

// --------------------------------- Campaigns ---------------------------------

export async function createCampaign(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "campaigns.manage");

  // 2) Validation
  const parsed = campaignSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Please fix the form errors");

  // 3) Mutation
  const campaign = await createCampaignRecord(parsed.data, session.user);

  // 4) Revalidation
  revalidatePath("/campaigns");

  // 5) Redirect
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaign(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "campaigns.manage");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Campaign not found");

  // 3) Validation
  const parsed = campaignSchema.partial().safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Please fix the form errors");

  // 4) Mutation
  await updateCampaignRecord(id, parsed.data, session.user);

  // 5) Revalidation
  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");

  // 6) Redirect
  redirect(`/campaigns/${id}`);
}

export async function deleteCampaign(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "campaigns.manage");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Campaign not found");

  // 3) Mutation
  await deleteCampaignRecord(id, session.user);

  // 4) Revalidation
  revalidatePath("/campaigns");

  // 5) Redirect
  redirect("/campaigns");
}

// --------------------------------- Follow-ups --------------------------------

export async function createFollowup(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "followups.manage");

  // 2) Validation
  const parsed = followupSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    throw new Error(message || "Please fix the form errors");
  }

  // 3) Mutation
  await createFollowupRecord(parsed.data, session.user);

  // 4) Revalidation
  revalidatePath("/follow-ups");
}

export async function completeFollowup(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "followups.manage");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Follow-up not found");

  // 3) Mutation
  await completeFollowupRecord(id, session.user, String(formData.get("notes") ?? ""));

  // 4) Revalidation
  revalidatePath("/follow-ups");
}

export async function rescheduleFollowup(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "followups.manage");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  const dueDate = new Date(String(formData.get("dueDate") ?? ""));
  if (!id || isNaN(dueDate.getTime())) throw new Error("A valid follow-up date is required");

  // 3) Mutation
  await rescheduleFollowupRecord(id, dueDate, session.user);

  // 4) Revalidation
  revalidatePath("/follow-ups");
}

export async function recordFollowupOutcome(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");
  requirePermission(session, "followups.manage");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Follow-up not found");

  // 3) Validation
  const outcome = String(formData.get("outcome") ?? "");
  if (!["INTERESTED", "NOT_INTERESTED", "NO_RESPONSE"].includes(outcome))
    throw new Error("Invalid outcome");

  // 4) Mutation
  await markFollowupOutcomeRecord(id, outcome as "INTERESTED" | "NOT_INTERESTED" | "NO_RESPONSE", session.user, String(formData.get("notes") ?? ""));

  // 5) Revalidation
  revalidatePath("/follow-ups");
}

// --------------------------------- Tasks ----------------------------------

export async function createTask(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");

  // 2) Validation
  const parsed = taskSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    throw new Error(message || "Please fix the form errors");
  }

  // 3) Mutation
  await createTaskRecord(parsed.data, session.user);

  // 4) Revalidation
  revalidatePath("/");
}

export async function completeTask(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Task not found");

  // 3) Mutation
  await completeTaskRecord(id, session.user);

  // 4) Revalidation
  revalidatePath("/");
}

export async function deleteTask(formData: FormData) {
  // 1) Authentication
  const session = await getCurrentUser();
  if (!session) throw new Error("You must be logged in");

  // 2) Getting the record id
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Task not found");

  // 3) Mutation
  await deleteTaskRecord(id, session.user);

  // 4) Revalidation
  revalidatePath("/");
}

// ------------------------------------ Auth -----------------------------------

export async function signInAction(formData: FormData) {
  // 1) Validation
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) throw new Error("Please fix the form errors");

  // 2) Sign in
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) throw new Error("Invalid email or password");

  // 3) Revalidation and redirect
  revalidatePath("/", "layout");
  const next = String(formData.get("next") ?? "/dashboard");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOutAction() {
  // 1) Sign out
  const supabase = await createClient();
  await supabase.auth.signOut();

  // 2) Revalidation and redirect
  revalidatePath("/", "layout");
  redirect("/login");
}