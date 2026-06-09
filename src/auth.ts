/**
 * [認証] NextAuth設定 - Edge Runtime 対応
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;
const authSecret = process.env.AUTH_SECRET;

if (!googleId || !googleSecret || !authSecret) {
  throw new Error(
    "AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, and AUTH_SECRET environment variables are required"
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  trustHost: true,
  providers: [
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
    }),
  ],
});
