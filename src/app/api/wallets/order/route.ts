import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/auth.server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderedIds = Array.isArray(body?.orderedIds) ? (body.orderedIds as string[]) : null;
  if (!orderedIds || orderedIds.some((id: unknown) => typeof id !== "string")) {
    return NextResponse.json({ error: "Invalid wallet order" }, { status: 400 });
  }

  const walletCount = await prisma.wallet.count({
    where: {
      id: { in: orderedIds },
      userId: user.id,
    },
  });

  if (walletCount !== orderedIds.length) {
    return NextResponse.json({ error: "Invalid or unauthorized wallet ids" }, { status: 400 });
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.wallet.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  revalidatePath("/");
  revalidatePath("/wallets");

  return NextResponse.json({ ok: true });
}
