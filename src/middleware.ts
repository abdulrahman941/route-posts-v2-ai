import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // هنا بنجيب التوكن وبنضيف السطرين دول عشان يقرأ الكوكيز المؤمنة على فيرسيل وعلى اللوكال في نفس الوقت
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production" // سطر حل اللغز!
  });

  // لو المستخدم معندوش توكن وبيحاول يدخل صفحة محمية
  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// المسارات المحمية
export const config = {
  matcher: ["/feed", "/profile", "/notifications", "/users"],
};