export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { makeDriveFileReadable } from "@/lib/google-drive";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  fileId: z.string().min(10).max(255),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const file = await makeDriveFileReadable(parsed.data.fileId);
    return NextResponse.json({ file });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Google Drive error";
    console.error("Google Drive upload completion error:", message);
    return NextResponse.json({
      error: "Could not make the Google Drive file embeddable.",
      detail: message,
    }, { status: 500 });
  }
}
