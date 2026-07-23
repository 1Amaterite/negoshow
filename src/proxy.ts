import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
