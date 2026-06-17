import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@/types/inventory';

// Augment Auth.js types so `id` and `role` are available on session/user/JWT.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
  interface User {
    role: UserRole;
  }
}

// JWT interface lives in @auth/core/jwt (next-auth/jwt only re-exports it),
// so the augmentation must target the original module to merge correctly.
declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
