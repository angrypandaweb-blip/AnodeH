import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|favicon-48\\.png|favicon-96\\.png|logo\\.png|icon\\.svg|icon\\.png|apple-icon(?:\\.png)?|opengraph-image(?:\\.png)?).*)"],
};
