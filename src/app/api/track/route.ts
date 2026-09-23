import { auth } from "@/auth";
import { recordEvent } from "@/lib/analytics/repository";
import { CONTACT_TARGETS, deviceType, isBot, normalizePath, normalizeRefTag, referrerHost, visitorHash } from "@/lib/analytics/tracking";

const skipped = () => new Response(null, { status: 204 });

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "development" && process.env.ANALYTICS_IN_DEV !== "true") return skipped();

    const userAgent = request.headers.get("user-agent") ?? "";
    if (isBot(userAgent) || request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1" || !isSameOrigin(request)) return skipped();

    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const path = normalizePath(payload?.path);
    if (!payload || !path) return skipped();

    const type = payload.type === "click" ? "click" : payload.type === "pageview" ? "pageview" : null;
    if (!type) return skipped();

    const target = typeof payload.target === "string" ? payload.target : "";
    if (type === "click" && !(CONTACT_TARGETS as readonly string[]).includes(target)) return skipped();

    const session = await auth();
    if (session?.role === "Admin") return skipped();

    const host = request.headers.get("host") ?? "";
    const isEntry = type === "pageview" && payload.isEntry === true;
    let city = request.headers.get("x-vercel-ip-city") ?? "";
    try {
      city = decodeURIComponent(city);
    } catch {
      city = "";
    }

    await recordEvent({
      type,
      path,
      referrer: isEntry ? referrerHost(payload.referrer, host) : "",
      refTag: isEntry ? normalizeRefTag(payload.ref) : "",
      isEntry,
      country: (request.headers.get("x-vercel-ip-country") ?? "").slice(0, 2),
      city: city.slice(0, 80),
      device: deviceType(userAgent),
      visitorHash: visitorHash(clientIp(request), userAgent, process.env.AUTH_SECRET ?? "dev-salt"),
      target: type === "click" ? target : "",
    });
  } catch (error) {
    console.error("track route failed", error);
  }

  return skipped();
}
