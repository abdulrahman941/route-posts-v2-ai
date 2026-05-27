import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // بنحاول نجيب التوكن المفرود على الدومين الحالي
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // لو المستخدم مش مسجل دخول وبيحاول يدخل صفحة محمية
  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
} // <-- القوس ده بيقفل الدالة هنا بشكل مستقل

export const config = {
  matcher: ["/feed", "/profile", "/notifications", "/users"],
};
