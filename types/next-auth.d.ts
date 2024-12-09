import { DefaultSession } from "next-auth";
import { Role, User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName?: string;
      role: PrismaUser["role"];
    } & DefaultSession["user"]
  }

  interface User extends PrismaUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}