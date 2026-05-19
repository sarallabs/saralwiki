export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { createDriveUploadSession } from "@/lib/google-drive";
import { isAllowedUploadType } from "@/lib/uploads";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
  size: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (!isAllowedUploadType(parsed.data.mimeType)) {
    return NextResponse.json({ error: "Only images, PDFs, audio, and video are allowed." }, { status: 400 });
  }

  try {
    const uploadSession = await createDriveUploadSession(parsed.data);
    return NextResponse.json(uploadSession);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Google Drive error";
    console.error("Google Drive upload session error:", message);
    return NextResponse.json({
      error: "Google Drive upload is not configured correctly.",
      detail: message,
    }, { status: 500 });
  }
}
