import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          const user = await User.findOne({
            $or: [
              { personalEmail: (credentials.email as string).toLowerCase() },
              { workEmail: (credentials.email as string).toLowerCase() },
            ],
            isActive: true,
          });

          if (
            !user ||
            !(await bcrypt.compare(
              credentials.password as string,
              user.password
            ))
          ) {
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.workEmail || user.personalEmail,
            role: user.role,
            position: user.position,
            personalEmail: user.personalEmail,
            workEmail: user.workEmail,
            phone: user.phone,
            reportsTo: user.reportsTo?.toString() || null,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error("Authentication failed:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60, // Update session every 1 hour instead of every request
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.position = user.position;
        token.personalEmail = user.personalEmail;
        token.workEmail = user.workEmail;
        token.phone = user.phone;
        token.reportsTo = user.reportsTo;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "super admin" | "admin" | "user";
        session.user.position = token.position as string;
        session.user.personalEmail = token.personalEmail as string;
        session.user.workEmail = token.workEmail as string;
        session.user.phone = token.phone as string;
        session.user.reportsTo = token.reportsTo as string | null;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authConfig;
