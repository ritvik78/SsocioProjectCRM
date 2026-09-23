import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";
import { createActivity, createAuditLog } from "@/lib/track";

const normalize = (s: unknown) => (typeof s === "string" ? s.trim() : "");

const keyNorm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Case/space/underscore-insensitive cell lookup so Excel headers like
 * "Name", "Instagram Username" or "Engagement Rate" map to name,
 * instagram_username, engagement_rate.
 */
function cell(row: Record<string, unknown>, key: string): string {
  const direct = row[key];
  if (direct !== undefined && direct !== null && direct !== "") return String(direct).trim();
  const target = keyNorm(key);
  for (const k of Object.keys(row)) {
    if (keyNorm(k) === target) {
      const v = row[k];
      if (v !== undefined && v !== null && v !== "") return String(v).trim();
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await apiRequirePermission("brands.add");
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type") === "influencer" ? "influencer" : "brand";
    const body = await req.json().catch(() => ({}));
    const csv: string = body.csv ?? "";
    if (!csv.trim()) return NextResponse.json({ error: "No CSV content provided" }, { status: 422 });

    const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
    if (parsed.errors.some((e) => e.type === "Quotes")) {
      return NextResponse.json({ error: "Invalid CSV — check quoted fields" }, { status: 422 });
    }
    const rawRows = parsed.data.filter((r) => Object.values(r).some((v) => normalize(v)));

    let created = 0;
    const errors: string[] = [];

    if (type === "influencer") {
      const statusMap = await ensureStatusesByName("influencer", ["NEW"]);
      for (const row of rawRows) {
        const name = cell(row, "name");
        if (!name) {
          errors.push("Row skipped: missing name");
          continue;
        }
        const email = cell(row, "email").toLowerCase();
        const username = cell(row, "instagram_username").replace(/^@/, "");
        const existing = email
          ? await prisma.influencer.findFirst({ where: { OR: email ? [{ email }] : [{ name }] } })
          : username
            ? await prisma.influencer.findFirst({ where: { instagramUsername: username } })
            : null;
        if (existing) {
          errors.push(`Skipped duplicate: ${name}`);
          continue;
        }
        const statusName = cell(row, "status") || "NEW";
        const status = statusMap[statusName.toLowerCase()] ?? statusMap.new;
        const influencer = await prisma.influencer.create({
          data: {
            name,
            instagramUsername: username || null,
            email: email || null,
            phone: cell(row, "phone") || null,
            category: cell(row, "category") || null,
            followers: parseInt(cell(row, "followers").replace(/[^0-9]/g, "")) || null,
            engagementRate: parseFloat(cell(row, "engagement_rate").replace(/[^0-9.]/g, "")) || null,
            platform: cell(row, "platform") || "INSTAGRAM",
            city: cell(row, "city") || null,
            state: cell(row, "state") || null,
            source: cell(row, "source") || null,
            statusId: status?.id ?? null,
            notes: cell(row, "notes") || null,
            assignedToId: ctx.user.id,
          },
        });
        await createActivity({
          influencerId: influencer.id,
          type: "LEAD_CREATED",
          description: `Influencer added via CSV import: ${influencer.name}`,
          userId: ctx.user.id,
        });
        created++;
      }
    } else {
      const statusMap = await ensureStatusesByName("brand", ["NEW LEAD"]);
      for (const row of rawRows) {
        const name = cell(row, "name");
        if (!name) {
          errors.push("Row skipped: missing name");
          continue;
        }
        const email = cell(row, "email").toLowerCase();
        const existing = email
          ? await prisma.brand.findFirst({ where: email ? { email } : { name } })
          : null;
        if (existing) {
          errors.push(`Skipped duplicate: ${name}`);
          continue;
        }
        const statusName = cell(row, "status") || "NEW LEAD";
        const status = statusMap[statusName.toLowerCase()] ?? statusMap["new lead"];
        await prisma.brand.create({
          data: {
            name,
            companyName: cell(row, "company_name") || null,
            contactName: cell(row, "contact_name") || null,
            designation: cell(row, "designation") || null,
            email: email || null,
            phone: cell(row, "phone") || null,
            website: cell(row, "website") || null,
            instagramHandle: cell(row, "instagram_handle") || null,
            industry: cell(row, "industry") || null,
            city: cell(row, "city") || null,
            state: cell(row, "state") || null,
            source: cell(row, "source") || null,
            statusId: status?.id ?? null,
            notes: cell(row, "notes") || null,
            leadOwnerId: ctx.user.id,
          },
        });
        created++;
      }
    }

    await createActivity({ type: "UPDATED", description: `CSV import finished: ${created} ${type} created`, userId: ctx.user.id });
    await createAuditLog({ userId: ctx.user.id, action: "CREATE", recordType: "Import", newValue: { type, created, errors: errors.length } });

    return NextResponse.json({ created, errors }, { status: created ? 201 : 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Import failed" }, { status: error.status ?? 500 });
  }
}

async function ensureStatusesByName(kind: "brand" | "influencer", names: string[]) {
  const model: any = kind === "brand" ? prisma.brandStatus : prisma.influencerStatus;
  const map: Record<string, any> = {};
  for (const name of names) {
    let status = await model.findUnique({ where: { name } });
    if (!status) {
      status = await model.create({ data: { name, isDefault: true } });
    }
    map[name.toLowerCase()] = status;
  }
  return map;
}
