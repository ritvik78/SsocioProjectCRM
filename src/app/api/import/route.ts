import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";
import { createActivity, createAuditLog } from "@/lib/track";

const normalize = (s: unknown) => (typeof s === "string" ? s.trim() : "");

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
        const name = normalize(row.name);
        if (!name) {
          errors.push("Row skipped: missing name");
          continue;
        }
        const email = normalize(row.email).toLowerCase();
        const username = normalize(row.instagram_username).replace(/^@/, "");
        const existing = email
          ? await prisma.influencer.findFirst({ where: { OR: email ? [{ email }] : [{ name }] } })
          : username
            ? await prisma.influencer.findFirst({ where: { instagramUsername: username } })
            : null;
        if (existing) {
          errors.push(`Skipped duplicate: ${name}`);
          continue;
        }
        const statusName = normalize(row.status) || "NEW";
        const status = statusMap[statusName.toLowerCase()] ?? statusMap.new;
        const influencer = await prisma.influencer.create({
          data: {
            name,
            instagramUsername: username || null,
            email: email || null,
            phone: normalize(row.phone) || null,
            category: normalize(row.category) || null,
            followers: parseInt(normalize(row.followers)) || null,
            engagementRate: parseFloat(normalize(row.engagement_rate)) || null,
            platform: normalize(row.platform) || "INSTAGRAM",
            city: normalize(row.city) || null,
            state: normalize(row.state) || null,
            source: normalize(row.source) || null,
            statusId: status?.id ?? null,
            notes: normalize(row.notes) || null,
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
        const name = normalize(row.name);
        if (!name) {
          errors.push("Row skipped: missing name");
          continue;
        }
        const email = normalize(row.email).toLowerCase();
        const existing = email
          ? await prisma.brand.findFirst({ where: email ? { email } : { name } })
          : null;
        if (existing) {
          errors.push(`Skipped duplicate: ${name}`);
          continue;
        }
        const statusName = normalize(row.status) || "NEW LEAD";
        const status = statusMap[statusName.toLowerCase()] ?? statusMap["new lead"];
        await prisma.brand.create({
          data: {
            name,
            companyName: normalize(row.company_name) || null,
            contactName: normalize(row.contact_name) || null,
            designation: normalize(row.designation) || null,
            email: email || null,
            phone: normalize(row.phone) || null,
            website: normalize(row.website) || null,
            instagramHandle: normalize(row.instagram_handle) || null,
            industry: normalize(row.industry) || null,
            city: normalize(row.city) || null,
            state: normalize(row.state) || null,
            source: normalize(row.source) || null,
            statusId: status?.id ?? null,
            notes: normalize(row.notes) || null,
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