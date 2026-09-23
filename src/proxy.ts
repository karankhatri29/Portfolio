import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((request) => {
  const role = request.auth?.role;
  const isApiRequest = request.nextUrl.pathname.startsWith("/api/");

  if (role !== "Admin") {
    if (isApiRequest) {
      return NextResponse.json({ error: "Admin access required" }, { status: request.auth ? 403 : 401 });
    }

    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/projects/:path*", "/api/skills/:path*", "/api/messages/:path*", "/api/export/:path*", "/api/highlights/:path*"],
};
