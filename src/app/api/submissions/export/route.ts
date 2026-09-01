import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") || undefined;
  const status = searchParams.get("status") || undefined;

  const submissions = await prisma.submission.findMany({
    where: {
      productId,
      status: status === "PENDING" || status === "SUBMITTED" ? status : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: {
      product: { include: { steps: { include: { fields: true } } } },
      values: true,
    },
  });

  const allFieldLabels = new Set<string>();
  for (const s of submissions) {
    for (const step of s.product.steps) {
      for (const f of step.fields) allFieldLabels.add(f.label);
    }
  }
  const fieldLabels = Array.from(allFieldLabels);

  const header = ["Product", "SO Number", "Status", "Created At", "Submitted At", ...fieldLabels];
  const rows = [header];

  for (const s of submissions) {
    const fieldsById = new Map(
      s.product.steps.flatMap((step) => step.fields.map((f) => [f.id, f])),
    );
    const valueByFieldId = new Map(s.values.map((v) => [v.fieldId, v]));

    const row = [
      s.product.name,
      s.soNumber,
      s.status,
      s.createdAt.toISOString(),
      s.submittedAt?.toISOString() ?? "",
    ];

    for (const label of fieldLabels) {
      const field = Array.from(fieldsById.values()).find((f) => f.label === label);
      if (!field) {
        row.push("");
        continue;
      }
      const fv = valueByFieldId.get(field.id);
      if (field.type === "FILE") {
        const files = (fv?.files as { url: string }[] | null) ?? [];
        row.push(files.map((f) => f.url).join("; "));
      } else {
        row.push(fv?.value ?? "");
      }
    }

    rows.push(row);
  }

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="submissions.csv"`,
    },
  });
}
