import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { verifyCredentials } from '@/server/auth-verify';

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/**
 * Auth.js v5 config. Credentials provider with JWT sessions (required — the
 * Credentials provider does not support database sessions). `role` and `id` are
 * carried through the jwt/session callbacks so server code can do RBAC.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Trust the host header. On Vercel this is auto-detected, but setting it
  // explicitly keeps prod working when self-hosted or running `next start`
  // locally (otherwise Auth.js throws UntrustedHost in production).
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        username: { label: 'ชื่อผู้ใช้' },
        password: { label: 'รหัสผ่าน', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await verifyCredentials(parsed.data.username, parsed.data.password);
        if (!user) return null;

        return { id: user.id, name: user.username, role: user.role };
      },
    }),
  ],
  callbacks: {
    // Used by proxy.ts (route protection): allow only authenticated requests.
    authorized({ auth }) {
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
