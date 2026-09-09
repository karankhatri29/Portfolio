import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { resolveRole } from "@/lib/auth/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google, GitHub],
  callbacks: {
    jwt({ token }) {
      token.role = resolveRole(token.email, process.env.AUTH_OWNER_EMAIL);
      return token;
    },
    session({ session, token }) {
      session.user = {
        ...session.user,
        email: token.email ?? null,
        name: token.name ?? null,
        image: token.picture ?? null,
      } as typeof session.user;
      session.role = (token.role as "Admin" | "Visitor" | undefined) ?? "Visitor";
      return session;
    },
  },
});
