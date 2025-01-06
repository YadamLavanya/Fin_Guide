import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { 
            email: credentials.email.toLowerCase(),
            isDeleted: false
          },
          include: { 
            auth: true
          }
        });

        if (!user || !user.auth) {
          throw new Error("Invalid credentials");
        }

        // Add password salt to the comparison
        const isValid = await bcrypt.compare(
          credentials.password + user.auth.passwordSalt,
          user.auth.password
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return user;
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // If it's a Google sign in
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { 
            email: token.email!,
            isDeleted: false
          }
        });

        if (existingUser) {
          // Update the user's Google provider info
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              provider: "google",
              providerAccountId: account.providerAccountId,
              emailVerified: new Date(),
            }
          });
          token.id = existingUser.id;
          token.role = existingUser.role;
        } else {
          // Create a new user
          const newUser = await prisma.user.create({
            data: {
              email: token.email!,
              firstName: token.name?.split(' ')[0] || 'User',
              lastName: token.name?.split(' ').slice(1).join(' ') || '',
              emailVerified: new Date(),
              provider: "google",
              providerAccountId: account.providerAccountId,
              preferences: {
                create: {
                  currencyId: (await prisma.currency.findFirst())!.id,
                  languageId: (await prisma.language.findFirst())!.id,
                  themeId: (await prisma.theme.findFirst())!.id,
                }
              }
            }
          });
          token.id = newUser.id;
          token.role = newUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async signIn({ user, account, profile }) {
      if (user) {
        return true; // Return true to allow sign in
      }
      return false;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};