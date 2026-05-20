import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refresh the Supabase auth cookie on every request so server components see
 * a valid session. Skips assets and the public marketing routes.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on every route except static files + favicon
    "/((?!_next/static|_next/image|favicon.ico|images/.*\\.(?:png|jpg|jpeg|svg|gif|webp)|.*\\.(?:woff2|woff|ttf)$).*)",
  ],
};
