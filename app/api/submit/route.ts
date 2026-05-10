import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RATE_LIMIT_PER_HOUR = 10; // IP당 시간당 최대 제출 수

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + "mugwangdo_salt").digest("hex");
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, "").toLowerCase();
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    region_sido?: string;
    region_gugun?: string;
    must_eat?: string;
    fingerprint?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { name, region_sido, region_gugun, must_eat, fingerprint } = body;

  if (!name || !region_sido || !region_gugun || !must_eat) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
  }

  if (must_eat.length > 20) {
    return NextResponse.json({ error: "20자 이내로 입력해주세요." }, { status: 400 });
  }

  const ip = getClientIp(req);
  const ip_hash = hashIp(ip);
  const name_normalized = normalizeName(name);

  // IP당 시간당 제출 횟수 제한
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip_hash)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // INSERT — DB unique 제약이 동시 요청의 중복을 원자적으로 차단
  const { error } = await supabase.from("submissions").insert({
    name,
    name_normalized,
    region_sido,
    region_gugun,
    must_eat,
    ip_hash,
    fingerprint: fingerprint ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 제보하신 맛집입니다." }, { status: 409 });
    }
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
