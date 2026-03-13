import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

/** Sube APK de EAS a Vercel Blob. Protegido con secret. */
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const UPLOAD_SECRET = process.env.APK_UPLOAD_SECRET;

export async function POST(req: Request) {
  if (!UPLOAD_SECRET) {
    return NextResponse.json(
      { error: "APK_UPLOAD_SECRET no configurado" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${UPLOAD_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { artifactUrl: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON inválido. Esperado: { artifactUrl: string }" },
      { status: 400 }
    );
  }

  const { artifactUrl } = body;
  if (!artifactUrl || typeof artifactUrl !== "string") {
    return NextResponse.json(
      { error: "artifactUrl requerido" },
      { status: 400 }
    );
  }

  if (!artifactUrl.startsWith("https://")) {
    return NextResponse.json(
      { error: "URL debe ser https" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(artifactUrl, {
      headers: { "User-Agent": "Nexora-APK-Upload/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `EAS responded ${res.status}` },
        { status: 502 }
      );
    }

    const blob = await put("nexora-mobile.apk", res.body!, {
      access: "public",
      contentType: "application/vnd.android.package-archive",
      addRandomSuffix: false,
      multipart: true,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (err) {
    console.error("[upload-apk] Error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Error subiendo a Blob",
      },
      { status: 500 }
    );
  }
}
